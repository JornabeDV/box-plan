import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// PATCH /api/subscriptions/[id]/cancel
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

    // Verificar si el usuario es admin
    const userRole = await sql`
      SELECT role FROM user_roles_simple WHERE user_id = ${session.user.id}
    `

    const isAdmin = userRole[0]?.role === 'admin'

    // Si es admin, puede cancelar cualquier suscripción
    // Si no es admin, solo puede cancelar su propia suscripción
    // Cancelar inmediatamente cambiando el status a 'canceled'
    if (isAdmin) {
      await sql`
        UPDATE subscriptions
        SET 
          status = 'canceled',
          cancel_at_period_end = false,
          updated_at = NOW()
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE subscriptions
        SET 
          status = 'canceled',
          cancel_at_period_end = false,
          updated_at = NOW()
        WHERE id = ${id} AND user_id = ${session.user.id}
      `
    }

    // Verificar que se actualizó al menos una fila
    const updated = await sql`
      SELECT * FROM subscriptions WHERE id = ${id}
    `

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada o no autorizado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Error al cancelar suscripción' },
      { status: 500 }
    )
  }
}