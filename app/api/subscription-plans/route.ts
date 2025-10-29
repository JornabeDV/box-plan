import { NextResponse } from 'next/server'
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
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { error: 'Error al cargar los planes' },
      { status: 500 }
    )
  }
}