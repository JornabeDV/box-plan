import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

// POST /api/subscriptions/change-plan
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
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

    // Obtener suscripción actual para mantener el método de pago y coachId
    // Usar findUnique y hacer cast para incluir paymentMethod que puede no estar en los tipos generados
    const currentSubscriptionRaw = await prisma.subscription.findUnique({
      where: { id: currentSubscriptionId }
    }) as { coachId: number | null; paymentMethod?: string | null } | null
    
    const currentSubscription = currentSubscriptionRaw ? {
      coachId: currentSubscriptionRaw.coachId,
      paymentMethod: (currentSubscriptionRaw as any).paymentMethod || null
    } : null

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
      const subscriptionData: any = {
        userId,
        planId: newPlanId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: newEndDate,
        cancelAtPeriodEnd: false,
        mercadopagoPaymentId: `change_${Date.now()}`
      }

      // Mantener método de pago anterior o usar 'plan_change'
      if (currentSubscription?.paymentMethod) {
        subscriptionData.paymentMethod = currentSubscription.paymentMethod
      } else {
        subscriptionData.paymentMethod = 'plan_change'
      }

      // Mantener coachId si existe
      if (currentSubscription?.coachId !== null && currentSubscription?.coachId !== undefined) {
        subscriptionData.coachId = currentSubscription.coachId
      }

      const newSubscription = await tx.subscription.create({
        data: subscriptionData
      })

      // Crear registro de pago
      await tx.paymentHistory.create({
        data: {
          userId,
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