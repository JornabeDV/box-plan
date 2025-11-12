import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

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
        coachId = authCheck.profile.id
      }
    }

    // Construir el filtro: si es coach, solo sus planes; si no, solo planes activos sin coachId (globales)
    const whereClause = coachId 
      ? { coachId } // Coach ve solo sus planes
      : { isActive: true, coachId: null } // Usuarios normales ven solo planes globales activos

    const plans = await prisma.subscriptionPlan.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        interval: true,
        features: true,
        isActive: true,
        coachId: true
      },
      orderBy: { price: 'asc' }
    })

    // Transformar features de JSONB a array si es necesario
    const formattedPlans = plans.map(plan => ({
      ...plan,
      is_active: plan.isActive,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      is_popular: plan.name === 'Pro'
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

// POST /api/subscription-plans - Crear nuevo plan (solo para admins)
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

    const body = await request.json()
    const { name, description, price, currency, interval, features, is_active = true } = body

    if (!name || !price || !currency || !interval) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, price, currency, interval' },
        { status: 400 }
      )
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description: description || null,
        price,
        currency,
        interval,
        features: features || [],
        isActive: is_active,
        coachId: coachId // Asociar el plan al coach
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
      features: plan.features,
      is_active: plan.isActive,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString()
    }

    return NextResponse.json(serializedPlan)
  } catch (error: any) {
    console.error('Error creating subscription plan:', error)
    return NextResponse.json(
      { error: 'Error al crear el plan' },
      { status: 500 }
    )
  }
}