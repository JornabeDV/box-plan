import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach } from '@/lib/auth-helpers'

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

    const subscriptionId = parseInt(params.id)

    // Verificar si el usuario es coach
    const authCheck = await isCoach(session.user.id)
    const isCoachUser = authCheck.isAuthorized

    // Si es coach, puede cancelar cualquier suscripción
    // Si no es coach, solo puede cancelar su propia suscripción
    const whereClause = isCoachUser
      ? { id: subscriptionId }
      : { id: subscriptionId, userId: session.user.id }

    try {
      const updated = await prisma.subscription.updateMany({
        where: whereClause,
        data: {
          status: 'canceled',
          cancelAtPeriodEnd: false
        }
      })

      if (updated.count === 0) {
        return NextResponse.json(
          { error: 'Suscripción no encontrada o no autorizado' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada o no autorizado' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Error al cancelar suscripción' },
      { status: 500 }
    )
  }
}