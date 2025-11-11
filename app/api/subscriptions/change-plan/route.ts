import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId }
    })

    if (!newPlan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    // Crear nueva suscripción y actualizar la actual en una transacción
    const newEndDate = new Date()
    newEndDate.setDate(newEndDate.getDate() + 30) // 30 días

    const result = await prisma.$transaction(async (tx) => {
      // Cancelar suscripción actual al final del período
      await tx.subscription.update({
        where: { id: currentSubscriptionId },
        data: {
          cancelAtPeriodEnd: true
        }
      })

      // Crear nueva suscripción
      const newSubscription = await tx.subscription.create({
        data: {
          userId: session.user.id,
          planId: newPlanId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: newEndDate,
          cancelAtPeriodEnd: false,
          mercadopagoPaymentId: `change_${Date.now()}`
        }
      })

      // Crear registro de pago
      await tx.paymentHistory.create({
        data: {
          userId: session.user.id,
          subscriptionId: newSubscription.id,
          amount: newPlan.price,
          currency: newPlan.currency,
          status: 'approved',
          mercadopagoPaymentId: `change_${Date.now()}`,
          paymentMethod: 'plan_change'
        }
      })

      return newSubscription
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error changing plan:', error)
    return NextResponse.json(
      { error: 'Error al cambiar plan' },
      { status: 500 }
    )
  }
}