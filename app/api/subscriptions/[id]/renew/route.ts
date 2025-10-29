import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// PATCH /api/subscriptions/[id]/renew
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = params

    // Extender el período
    const newEndDate = new Date()
    newEndDate.setDate(newEndDate.getDate() + 30)

    await sql`
      UPDATE subscriptions
      SET 
        current_period_end = ${newEndDate.toISOString()},
        status = 'active',
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id}
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
      SELECT 
        ${session.user.id},
        ${id},
        sp.price,
        sp.currency,
        'approved',
        ${`renewal_${Date.now()}`},
        'mercadopago'
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error renewing subscription:', error)
    return NextResponse.json(
      { error: 'Error al renovar suscripción' },
      { status: 500 }
    )
  }
}