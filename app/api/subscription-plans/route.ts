import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/subscription-plans
export async function GET() {
  try {
    const plans = await sql`
      SELECT 
        id,
        name,
        description,
        price,
        currency,
        interval,
        features,
        is_active
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY price ASC
    `

    // Transformar features de JSONB a array si es necesario
    const formattedPlans = plans.map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      is_popular: plan.name === 'Pro'
    }))

    return NextResponse.json(formattedPlans)
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
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es admin
    const adminProfile = await sql`
      SELECT id FROM admin_profiles WHERE user_id = ${session.user.id}
    `

    if (adminProfile.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, price, currency, interval, features, is_active = true } = body

    if (!name || !price || !currency || !interval) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, price, currency, interval' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO subscription_plans (name, description, price, currency, interval, features, is_active)
      VALUES (${name}, ${description || null}, ${price}, ${currency}, ${interval}, ${JSON.stringify(features || [])}::jsonb, ${is_active})
      RETURNING *
    `

    // Convertir valores de PostgreSQL a tipos JavaScript serializables
    const plan = result[0]
    const serializedPlan = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: typeof plan.price === 'object' && plan.price !== null ? Number(plan.price) : Number(plan.price),
      currency: plan.currency,
      interval: plan.interval,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      is_active: plan.is_active,
      created_at: plan.created_at ? new Date(plan.created_at).toISOString() : null,
      updated_at: plan.updated_at ? new Date(plan.updated_at).toISOString() : null
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