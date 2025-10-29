import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/subscriptions/current
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Buscar suscripción activa del usuario
    const subscription = await sql`
      SELECT 
        s.id,
        s.user_id,
        s.plan_id,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        s.mercadopago_subscription_id,
        s.mercadopago_payment_id,
        s.created_at,
        s.updated_at,
        jsonb_build_object(
          'name', sp.name,
          'price', sp.price,
          'features', sp.features
        ) as subscription_plans
      FROM subscriptions s
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = ${session.user.id}
        AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `

    if (!subscription || subscription.length === 0) {
      return NextResponse.json({ data: null })
    }

    // Transformar el objeto subscription_plans
    const result = {
      ...subscription[0],
      subscription_plans: typeof subscription[0].subscription_plans === 'string' 
        ? JSON.parse(subscription[0].subscription_plans) 
        : subscription[0].subscription_plans
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error fetching current subscription:', error)
    return NextResponse.json(
      { error: 'Error al cargar la suscripción' },
      { status: 500 }
    )
  }
}