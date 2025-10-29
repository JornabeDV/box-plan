import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// POST /api/subscriptions/change-plan
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { newPlanId, currentSubscriptionId } = await request.json()

    if (!newPlanId || !currentSubscriptionId) {
      return NextResponse.json(
        { error: 'Parámetros faltantes' },
        { status: 400 }
      )
    }

    // Obtener nuevo plan
    const newPlan = await sql`
      SELECT * FROM subscription_plans WHERE id = ${newPlanId}
    `

    if (!newPlan || newPlan.length === 0) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    // Cancelar suscripción actual al final del período
    await sql`
      UPDATE subscriptions
      SET 
        cancel_at_period_end = true,
        updated_at = NOW()
      WHERE id = ${currentSubscriptionId}
    `

    // Crear nueva suscripción
    const newEndDate = new Date()
    newEndDate.setDate(newEndDate.getDate() + 30) // 30 días

    const newSubscription = await sql`
      INSERT INTO subscriptions (
        user_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        mercadopago_payment_id
      )
      VALUES (
        ${session.user.id},
        ${newPlanId},
        'active',
        NOW(),
        ${newEndDate.toISOString()},
        false,
        ${`change_${Date.now()}`}
      )
      RETURNING *
    `

    // Crear registro de pago
    await sql`
      INSERT INTO payment_history (
        user_id,
        subscription_id,
        amount,
        currency,
        status,
        mercadopago_payment_id,
        payment_method
      )
      VALUES (
        ${session.user.id},
        ${newSubscription[0].id},
        ${newPlan[0].price},
        ${newPlan[0].currency},
        'approved',
        ${`change_${Date.now()}`},
        'plan_change'
      )
    `

    return NextResponse.json({ data: newSubscription[0] })
  } catch (error) {
    console.error('Error changing plan:', error)
    return NextResponse.json(
      { error: 'Error al cambiar plan' },
      { status: 500 }
    )
  }
}