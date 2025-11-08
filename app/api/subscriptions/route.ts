import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// POST /api/subscriptions
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      user_id,
      plan_id,
      status = 'active',
      current_period_start,
      current_period_end,
      cancel_at_period_end = false,
      payment_method = 'admin_assignment'
    } = body

    if (!user_id || !plan_id) {
      return NextResponse.json(
        { error: 'user_id y plan_id son requeridos' },
        { status: 400 }
      )
    }

    // Obtener información del plan para el registro de pago
    const plan = await sql`
      SELECT * FROM subscription_plans WHERE id = ${plan_id}
    `

    if (!plan || plan.length === 0) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    // Crear la suscripción
    const newSubscription = await sql`
      INSERT INTO subscriptions (
        user_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end
      )
      VALUES (
        ${user_id},
        ${plan_id},
        ${status},
        ${current_period_start},
        ${current_period_end},
        ${cancel_at_period_end}
      )
      RETURNING *
    `

    // Crear registro de pago en payment_history
    try {
      await sql`
        INSERT INTO payment_history (
          user_id,
          subscription_id,
          amount,
          currency,
          status,
          payment_method
        )
        VALUES (
          ${user_id},
          ${newSubscription[0].id},
          ${plan[0].price},
          ${plan[0].currency},
          'approved',
          ${payment_method}
        )
      `
    } catch (paymentError) {
      console.error('Error creating payment history:', paymentError)
    }

    return NextResponse.json(newSubscription[0])
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Error al crear suscripción' },
      { status: 500 }
    )
  }
}