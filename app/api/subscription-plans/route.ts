import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'
import { getPlanificationAccess, type StudentPlanTier } from '@/lib/coach-plan-features'

// GET /api/subscription-plans
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    let coachId: number | null = null
    
    // Verificar si el usuario es coach y obtener su coachId
    const userId = normalizeUserId(session?.user?.id)
    if (userId) {
      const authCheck = await isCoach(userId)
      if (authCheck.isAuthorized && authCheck.profile) {
        // Si es coach, usar su propio coachId
        coachId = authCheck.profile.id
      } else {
        // Si no es coach, buscar su coach asignado (estudiante)
        const relationship = await prisma.coachStudentRelationship.findFirst({
          where: {
            studentId: userId,
            status: 'active'
          },
          select: {
            coachId: true
          }
        })
        
        if (relationship) {
          coachId = relationship.coachId
        }
      }
    }

    // Construir el filtro:
    // - Si es coach o tiene coach asignado, mostrar planes de ese coach
    // - Si no tiene coach, mostrar planes globales (sin coachId) o vacío
    const whereClause = coachId 
      ? { coachId, isActive: true } // Planes del coach (activos)
      : { isActive: true, coachId: null } // Planes globales activos (sin coach)

    const plans = await prisma.subscriptionPlan.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            subscriptions: true
          }
        }
      },
      orderBy: { price: 'asc' }
    })

    // Transformar features de JSONB a array si es necesario
    const formattedPlans = plans.map(plan => ({
      ...plan,
      is_active: plan.isActive,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      is_popular: plan.tier === 'premium' || plan.tier === 'vip'
    }))

    const response = NextResponse.json(formattedPlans)
    // Caché moderado para reducir queries pero mantener datos relativamente frescos
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=15')
    return response
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error)
    
    // Si la tabla no existe, retornar array vacío en lugar de error
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
      where: { coachId }
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
      is_active = true 
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
