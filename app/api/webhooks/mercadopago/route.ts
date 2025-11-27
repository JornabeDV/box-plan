import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { calculatePaymentSplit } from '@/lib/payment-helpers'

export async function POST(request: NextRequest) {
  try {
    const body: { data: { id: string } | string, type: string } = await request.json()
    
    if (body.type === 'payment') {
      const paymentId = typeof body.data === 'string' ? body.data : body.data.id
      await handlePayment(paymentId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error en webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePayment(paymentId: string) {
  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!mpAccessToken) {
    throw new Error('MercadoPago access token not configured')
  }

  const client = new MercadoPagoConfig({ accessToken: mpAccessToken })
  const payment = await new Payment(client).get({ id: paymentId })

  if (payment.status === 'approved') {
    const { user_id, plan_id, coach_id } = payment.metadata || {}
    
    if (!user_id || !plan_id) {
      console.error('Missing user_id or plan_id in payment metadata')
      return
    }

    const userId = parseInt(user_id)
    const planId = parseInt(plan_id)
    const coachId = coach_id ? parseInt(coach_id) : null

    if (coachId) {
      await createSubscriptionWithSplit({ userId, planId, coachId, payment, paymentId })
    } else {
      await createDirectSubscription({ userId, planId, payment, paymentId })
    }
  }

  // Actualizar payment history
  const preferenceId = (payment as any).preference_id
  if (preferenceId) {
    await prisma.paymentHistory.updateMany({
      where: { mercadopagoPreferenceId: preferenceId },
      data: {
        status: payment.status === 'approved' ? 'approved' : 'rejected',
        mercadopagoPaymentId: paymentId
      }
    })
  }
}

function calculatePeriodEnd(interval: 'month' | 'year'): Date {
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + (interval === 'year' ? 12 : 1))
  return periodEnd
}

async function createSubscriptionWithSplit({
  userId,
  planId,
  coachId,
  payment,
  paymentId
}: {
  userId: number
  planId: number
  coachId: number
  payment: any
  paymentId: string
}) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    include: { coach: true }
  })

  if (!plan || !plan.coach) {
    throw new Error(`Plan ${planId} o coach no encontrado`)
  }

  const coach = plan.coach
  const totalAmount = Number(plan.price)
  const coachRate = Number(coach.commissionRate)
  const platformRate = Number(coach.platformCommissionRate)

  if (Math.abs(coachRate + platformRate - 100) > 0.01) {
    throw new Error('Comisiones no suman 100%')
  }

  const split = calculatePaymentSplit(totalAmount, coachRate, platformRate)
  const now = new Date()
  const periodEnd = calculatePeriodEnd(plan.interval as 'month' | 'year')
  const isNativeSplit = true // Con marketplace_fee, MercadoPago ya distribuyó el dinero
  const preferenceId = (payment as any).preference_id
  const paymentIdStr = payment.id?.toString() || paymentId

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findFirst({
      where: { userId, status: 'active' }
    })

    const subscription = existing
      ? await tx.subscription.update({
          where: { id: existing.id },
          data: {
            planId,
            coachId,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            mercadopagoPaymentId: paymentIdStr,
            paymentMethod: 'mercadopago'
          }
        })
      : await tx.subscription.create({
          data: {
            userId,
            planId,
            coachId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            mercadopagoPaymentId: paymentIdStr,
            paymentMethod: 'mercadopago',
            cancelAtPeriodEnd: false
          }
        })

    // Crear comisión si no existe
    const existingCommission = await tx.coachCommission.findFirst({
      where: { studentSubscriptionId: subscription.id, periodStart: now }
    })

    if (!existingCommission) {
      await tx.coachCommission.create({
        data: {
          coachId,
          studentSubscriptionId: subscription.id,
          studentId: userId,
          commissionAmount: split.coachAmount,
          commissionRate: split.coachRate,
          platformCommissionAmount: split.platformAmount,
          platformCommissionRate: split.platformRate,
          studentSubscriptionAmount: split.totalAmount,
          periodStart: now,
          periodEnd,
          status: isNativeSplit ? 'paid' : 'approved',
          ...(isNativeSplit && { paidAt: now })
        }
      })
    }

    // Actualizar totalEarnings del coach
    await tx.coachProfile.update({
      where: { id: coachId },
      data: { totalEarnings: { increment: split.coachAmount } }
    })

    // Registrar pagos en PaymentHistory
    const paymentData = {
      subscriptionId: subscription.id,
      currency: plan.currency,
      mercadopagoPaymentId: paymentIdStr,
      paymentMethod: 'mercadopago' as const,
      ...(preferenceId && { mercadopagoPreferenceId: preferenceId })
    }

    await tx.paymentHistory.createMany({
      data: [
        {
          userId,
          amount: split.totalAmount,
          status: 'approved',
          recipientType: 'student',
          ...paymentData
        },
        {
          userId: coach.userId,
          amount: split.coachAmount,
          status: isNativeSplit ? 'paid' : 'approved',
          recipientType: 'coach',
          recipientId: coachId,
          splitAmount: split.coachAmount,
          ...paymentData
        },
        {
          userId,
          amount: split.platformAmount,
          status: isNativeSplit ? 'paid' : 'approved',
          recipientType: 'platform',
          splitAmount: split.platformAmount,
          ...paymentData
        }
      ]
    })

    // Resetear lastPreferenceChangeDate para permitir cambio de preferencias en el nuevo período
    await tx.userPreference.updateMany({
      where: { userId },
      data: { lastPreferenceChangeDate: null }
    })

    return subscription
  })
}

async function createDirectSubscription({
  userId,
  planId,
  payment,
  paymentId
}: {
  userId: number
  planId: number
  payment: any
  paymentId: string
}) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  })

  if (!plan) {
    throw new Error(`Plan ${planId} no encontrado`)
  }

  const now = new Date()
  const periodEnd = calculatePeriodEnd(plan.interval as 'month' | 'year')
  const preferenceId = (payment as any).preference_id
  const paymentIdStr = payment.id?.toString() || paymentId

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findFirst({
      where: { userId, status: 'active' }
    })

    const subscription = existing
      ? await tx.subscription.update({
          where: { id: existing.id },
          data: {
            planId,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            mercadopagoPaymentId: paymentIdStr,
            paymentMethod: 'mercadopago'
          }
        })
      : await tx.subscription.create({
          data: {
            userId,
            planId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            mercadopagoPaymentId: paymentIdStr,
            paymentMethod: 'mercadopago',
            cancelAtPeriodEnd: false
          }
        })

    await tx.paymentHistory.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: Number(plan.price),
        currency: plan.currency,
        status: 'approved',
        recipientType: 'platform',
        mercadopagoPaymentId: paymentIdStr,
        ...(preferenceId && { mercadopagoPreferenceId: preferenceId }),
        paymentMethod: 'mercadopago'
      }
    })

    // Resetear lastPreferenceChangeDate para permitir cambio de preferencias en el nuevo período
    await tx.userPreference.updateMany({
      where: { userId },
      data: { lastPreferenceChangeDate: null }
    })

    return subscription
  })
}