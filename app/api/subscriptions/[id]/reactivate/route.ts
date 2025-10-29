import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// PATCH /api/subscriptions/[id]/reactivate
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

    await sql`
      UPDATE subscriptions
      SET 
        cancel_at_period_end = false,
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return NextResponse.json(
      { error: 'Error al reactivar suscripción' },
      { status: 500 }
    )
  }
}