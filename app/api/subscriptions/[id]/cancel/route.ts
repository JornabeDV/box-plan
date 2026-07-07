import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-server-helpers'

// PATCH /api/subscriptions/[id]/cancel
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const subscriptionId = parseInt(params.id, 10)

    // Obtener la suscripción para verificar propiedad
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { id: true, userId: true }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      )
    }

    // Verificar autorización
    const authCheck = await isCoach(userId)
    const isCoachUser = authCheck.isAuthorized

    let canCancel = false
    if (subscription.userId === userId) {
      canCancel = true
    } else if (isCoachUser && authCheck.profile) {
      const relationship = await prisma.coachStudentRelationship.findFirst({
        where: {
          coachId: authCheck.profile.id,
          studentId: subscription.userId,
          status: 'active'
        }
      })
      canCancel = !!relationship
    }

    if (!canCancel) {
      return NextResponse.json(
        { error: 'No autorizado para cancelar esta suscripción' },
        { status: 403 }
      )
    }

    try {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true
        }
      })

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