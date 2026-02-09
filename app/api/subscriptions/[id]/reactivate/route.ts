import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'

// PATCH /api/subscriptions/[id]/reactivate
// Reactiva una suscripción cancelada o vencida
// - Extiende el período 30 días desde hoy
// - Cambia status a 'active'
// - Pone cancelAtPeriodEnd en false
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    const currentUserId = normalizeUserId(session?.user?.id)
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const subscriptionId = parseInt(params.id, 10)
    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'ID de suscripción inválido' },
        { status: 400 }
      )
    }

    // Obtener la suscripción
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      )
    }

    // Verificar autorización
    const authCheck = await isCoach(currentUserId)
    const isCoachUser = authCheck.isAuthorized

    if (isCoachUser && authCheck.profile) {
      // El coach puede reactivar suscripciones de sus estudiantes
      const relationship = await prisma.coachStudentRelationship.findFirst({
        where: {
          coachId: authCheck.profile.id,
          studentId: subscription.userId,
          status: 'active'
        }
      })

      if (!relationship) {
        return NextResponse.json(
          { error: 'No autorizado. El usuario no es tu estudiante.' },
          { status: 403 }
        )
      }
    } else if (subscription.userId !== currentUserId) {
      // Si no es coach, solo puede reactivar su propia suscripción
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Calcular nuevo período (30 días desde hoy)
    const newPeriodStart = new Date()
    const newPeriodEnd = new Date()
    newPeriodEnd.setDate(newPeriodEnd.getDate() + 30)

    // Reactivar la suscripción
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd
      }
    })

    return NextResponse.json({ 
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        currentPeriodStart: updated.currentPeriodStart,
        currentPeriodEnd: updated.currentPeriodEnd
      }
    })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return NextResponse.json(
      { error: 'Error al reactivar suscripción' },
      { status: 500 }
    )
  }
}
