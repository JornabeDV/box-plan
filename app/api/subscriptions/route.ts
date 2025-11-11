import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      cancel_at_period_end = false,
      payment_method = 'admin_assignment'
    } = body

    if (!user_id || !plan_id) {
      return NextResponse.json(
        { error: 'user_id y plan_id son requeridos' },
        { status: 400 }
      )
    }

    // Obtener información del plan para el registro de pago
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: plan_id }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    // Crear la suscripción y el registro de pago en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const newSubscription = await tx.subscription.create({
        data: {
          userId: user_id,
          planId: plan_id,
          status,
          currentPeriodStart: new Date(current_period_start),
          currentPeriodEnd: new Date(current_period_end),
          cancelAtPeriodEnd: cancel_at_period_end
        }
      })

      // Crear registro de pago en payment_history
      try {
        await tx.paymentHistory.create({
          data: {
            userId: user_id,
            subscriptionId: newSubscription.id,
            amount: plan.price,
            currency: plan.currency,
            status: 'approved',
            paymentMethod: payment_method
          }
        })
      } catch (paymentError) {
        console.error('Error creating payment history:', paymentError)
      }

      return newSubscription
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Error al crear suscripción' },
      { status: 500 }
    )
  }
}