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
      cancel_at_period_end = false
    } = body

    if (!user_id || !plan_id) {
      return NextResponse.json(
        { error: 'user_id y plan_id son requeridos' },
        { status: 400 }
      )
    }

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

    return NextResponse.json(newSubscription[0])
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Error al crear suscripción' },
      { status: 500 }
    )
  }
}