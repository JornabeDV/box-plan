import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-server-helpers'
import { getPlanificationAccess, type StudentPlanTier } from '@/lib/coach-plan-features'
import { nanoid } from 'nanoid'

// GET /api/subscription-plans
// - ?planId=123 -> Devuelve un plan específico (público, para links compartibles)
// - Sin query -> Devuelve planes NO personalizados del coach asignado o globales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const planIdParam = searchParams.get('planId')

    // 1. Link compartible de plan personalizado: devolver plan por ID sin importar auth
    if (planIdParam) {
      const planId = parseInt(planIdParam, 10)
      if (isNaN(planId)) {
        return NextResponse.json({ error: 'ID de plan inválido' }, { status: 400 })
      }

      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          coach: {
            select: {
              id: true,
              businessName: true,
              user: { select: { name: true } }
            }
          },
          _count: { select: { subscriptions: true } }
        }
      })

      if (!plan || !plan.isActive) {
        return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
      }

      const serializedPlan = {
        ...plan,
        is_active: plan.isActive,
        is_personalized: plan.isPersonalized,
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
        is_popular: plan.tier === 'premium' || plan.tier === 'vip',
        price: Number(plan.price)
      }

      const response = NextResponse.json(serializedPlan)
      response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=15')
      return response
    }

    // 2. Listado público general: solo planes no personalizados
    const session = await auth()
    let coachId: number | null = null
    let isCoachUser = false

    const userId = normalizeUserId(session?.user?.id)
    if (userId) {
      const authCheck = await isCoach(userId)
      if (authCheck.isAuthorized && authCheck.profile) {
        coachId = authCheck.profile.id
        isCoachUser = true
      } else {
        const relationship = await prisma.coachStudentRelationship.findFirst({
          where: { studentId: userId, status: 'active' },
          select: { coachId: true }
        })
        if (relationship) {
          coachId = relationship.coachId
        }
      }
    }

    const whereClause: any = {
      isActive: true
    }

    if (coachId) {
      whereClause.coachId = coachId
      // Solo el coach ve sus planes personalizados (para gestionarlos)
      // Los estudiantes con coach asignado solo ven los planes públicos
      if (!isCoachUser) {
        whereClause.isPersonalized = false
      }
    } else {
      // Usuarios sin coach solo ven planes globales no personalizados
      whereClause.coachId = null
      whereClause.isPersonalized = false
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: whereClause,
      include: {
        coach: {
          select: {
            id: true,
            businessName: true,
            user: { select: { name: true } }
          }
        },
        _count: { select: { subscriptions: true } }
      },
      orderBy: { price: 'asc' }
    })

    const formattedPlans = plans.map(plan => ({
      ...plan,
      is_active: plan.isActive,
      is_personalized: plan.isPersonalized,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      is_popular: plan.tier === 'premium' || plan.tier === 'vip'
    }))

    const response = NextResponse.json(formattedPlans)
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=15')
    return response
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error)

    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Tabla subscription_plans no existe')
      return NextResponse.json([])
    }

    return NextResponse.json(
      { error: 'Error al cargar los planes' },
      { status: 500 }
    )
  }
}

// Niveles de tier para comparación
const TIER_LEVELS: Record<StudentPlanTier, number> = {
  'basic': 1,
  'standard': 2,
  'premium': 3,
  'vip': 4
}

// POST /api/subscription-plans - Crear nuevo plan (solo para coaches)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(userId)

    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id

    // Obtener el plan activo del coach
    const coachProfile = await prisma.coachProfile.findUnique({
      where: { id: coachId },
      include: {
        subscriptions: {
          where: {
            status: { in: ['active', 'Active', 'ACTIVE'] }
          },
          orderBy: { currentPeriodEnd: 'desc' },
          take: 1,
          include: { plan: true }
        }
      }
    })

    if (!coachProfile || coachProfile.subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No tienes un plan de coach activo' },
        { status: 403 }
      )
    }

    const coachPlan = coachProfile.subscriptions[0].plan

    // ==========================================
    // VALIDACIÓN 1: Cantidad máxima de planes
    // ==========================================
    const currentPlansCount = await prisma.subscriptionPlan.count({
      where: { coachId, isActive: true }
    })

    if (currentPlansCount >= coachPlan.maxStudentPlans) {
      return NextResponse.json(
        { 
          error: 'Límite de planes alcanzado',
          message: `Tu plan ${coachPlan.name} permite crear hasta ${coachPlan.maxStudentPlans} planes. Has creado ${currentPlansCount}.`,
          current: currentPlansCount,
          limit: coachPlan.maxStudentPlans,
          canUpgrade: coachPlan.slug !== 'elite'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      price, 
      currency, 
      interval, 
      tier = 'basic',
      features = {},
      is_active = true,
      is_personalized = false
    } = body

    if (!name || !price || !currency || !interval) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, price, currency, interval' },
        { status: 400 }
      )
    }

    // ==========================================
    // VALIDACIÓN 2: Tier del plan
    // ==========================================
    const requestedTier = tier as StudentPlanTier
    const coachMaxTier = coachPlan.maxStudentPlanTier as StudentPlanTier

    if (TIER_LEVELS[requestedTier] > TIER_LEVELS[coachMaxTier]) {
      return NextResponse.json(
        { 
          error: 'Tier no permitido',
          message: `Tu plan ${coachPlan.displayName} solo permite crear planes de tipo "${coachMaxTier}" o inferior.`,
          requestedTier,
          allowedTier: coachMaxTier
        },
        { status: 403 }
      )
    }

    // ==========================================
    // VALIDACIÓN 3: Features solicitadas
    // ==========================================
    const coachFeatures = coachPlan.features as Record<string, any> || {}
    const validationErrors: string[] = []

    // Validar WhatsApp
    if (features.whatsappSupport && !coachFeatures.whatsapp_integration) {
      validationErrors.push('No puedes ofrecer soporte por WhatsApp sin tenerlo en tu plan.')
    }

    // Validar Comunidad
    if (features.communityAccess && !coachFeatures.community_forum) {
      validationErrors.push('No puedes ofrecer acceso a la comunidad sin tener el foro habilitado.')
    }

    // Validar Scores/Progreso
    if (features.progressTracking && !coachFeatures.score_loading) {
      validationErrors.push('No puedes ofrecer seguimiento de progreso sin tener carga de scores.')
    }

    // Validar Leaderboard
    if (features.leaderboardAccess && !coachFeatures.score_database) {
      validationErrors.push('No puedes ofrecer ranking sin tener base de datos de scores.')
    }

    // Validar Timer
    if (features.timerAccess && !coachFeatures.timer) {
      validationErrors.push('No puedes ofrecer acceso al cronómetro sin tenerlo en tu plan.')
    }

    // Validar Planificaciones Personalizadas
    if (features.personalizedWorkouts && !coachFeatures.personalized_planifications) {
      validationErrors.push('No puedes ofrecer planificaciones personalizadas sin tener el feature habilitado.')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Features no permitidas',
          messages: validationErrors
        },
        { status: 403 }
      )
    }

    // ==========================================
    // ASIGNAR: Planificación (heredada del coach)
    // ==========================================
    const planificationAccess = getPlanificationAccess(coachFeatures)

    // Construir features finales (solo las permitidas según el plan del coach)
    const finalFeatures = {
      // Features condicionales (solo si el coach las tiene Y las solicitó)
      whatsappSupport: coachFeatures.whatsapp_integration && features.whatsappSupport,
      communityAccess: coachFeatures.community_forum && features.communityAccess,
      progressTracking: coachFeatures.score_loading && features.progressTracking,
      leaderboardAccess: coachFeatures.score_database && features.leaderboardAccess,
      timerAccess: coachFeatures.timer && (features.timerAccess ?? true), // Default true si coach tiene timer
      personalizedWorkouts: coachFeatures.personalized_planifications && features.personalizedWorkouts,
    }

    // Crear el plan
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description: description || null,
        price,
        currency,
        interval,
        tier: requestedTier,
        planificationAccess,
        features: finalFeatures,
        isActive: is_active,
        isPersonalized: is_personalized,
        shareToken: is_personalized ? nanoid(24) : null,
        coachId: coachId
      }
    })

    // Serializar para respuesta
    const serializedPlan = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: Number(plan.price),
      currency: plan.currency,
      interval: plan.interval,
      tier: plan.tier,
      planificationAccess: plan.planificationAccess,
      features: plan.features,
      is_active: plan.isActive,
      is_personalized: plan.isPersonalized,
      share_token: plan.shareToken,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      plan: serializedPlan,
      remainingPlans: coachPlan.maxStudentPlans - (currentPlansCount + 1)
    })

  } catch (error: any) {
    console.error('Error creating subscription plan:', error)
    return NextResponse.json(
      { error: 'Error al crear el plan', message: error.message },
      { status: 500 }
    )
  }
}
