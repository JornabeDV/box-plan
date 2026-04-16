import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'

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

interface PaymentInfo {
  user_id?: string
  plan_id?: string
  coach_id?: string
  status?: string
  preferenceId?: string
}

async function fetchPaymentInfo(paymentId: string): Promise<PaymentInfo> {
  // Intentar con token de plataforma
  const platformToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (platformToken) {
    try {
      const client = new MercadoPagoConfig({ accessToken: platformToken })
      const payment = await new Payment(client).get({ id: paymentId })
      return {
        ...(payment.metadata || {}),
        status: payment.status ?? undefined,
        preferenceId: (payment as any).preference_id
      }
    } catch {
      // Si falla, intentar con tokens de coaches
    }
  }

  // Buscar el coach que creó esta preferencia y usar su token
  const coachProfiles = await prisma.coachProfile.findMany({
    where: { mercadoPagoAccessToken: { not: null } },
    select: { mercadoPagoAccessToken: true }
  })

  for (const coach of coachProfiles) {
    try {
      const client = new MercadoPagoConfig({ accessToken: coach.mercadoPagoAccessToken! })
      const payment = await new Payment(client).get({ id: paymentId })
      return {
        ...(payment.metadata || {}),
        status: payment.status ?? undefined,
        preferenceId: (payment as any).preference_id
      }
    } catch {
      continue
    }
  }

  return {}
}

async function handlePayment(paymentId: string) {
  const info = await fetchPaymentInfo(paymentId)

  const { user_id, plan_id, coach_id, status, preferenceId } = info

  // Si no está aprobado, marcar como rechazado y salir
  if (status !== 'approved') {
    if (preferenceId) {
      await prisma.paymentHistory.updateMany({
        where: { mercadopagoPreferenceId: preferenceId },
        data: { status: 'rejected', mercadopagoPaymentId: paymentId }
      })
    }
    return
  }

  if (!user_id || !plan_id) {
    console.error('Missing user_id or plan_id in payment metadata', { paymentId })
    return
  }

  const userId = parseInt(user_id)
  const planId = parseInt(plan_id)
  const coachId = coach_id ? parseInt(coach_id) : null

  await createSubscription({ userId, planId, coachId, paymentId, preferenceId })
}

function calculatePeriodEnd(interval: 'month' | 'year'): Date {
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + (interval === 'year' ? 12 : 1))
  return periodEnd
}

async function createSubscription({
  userId,
  planId,
  coachId,
  paymentId,
  preferenceId
}: {
  userId: number
  planId: number
  coachId: number | null
  paymentId: string
  preferenceId?: string
}) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  })

  if (!plan) {
    throw new Error(`Plan ${planId} no encontrado`)
  }

  const now = new Date()
  const periodEnd = calculatePeriodEnd(plan.interval as 'month' | 'year')

  await prisma.$transaction(async (tx) => {
    // Crear o renovar la suscripción
    const existing = await tx.subscription.findFirst({
      where: { userId, status: 'active' }
    })

    const subscription = existing
      ? await tx.subscription.update({
          where: { id: existing.id },
          data: {
            planId,
            ...(coachId && { coachId }),
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            mercadopagoPaymentId: paymentId,
            paymentMethod: 'mercadopago'
          }
        })
      : await tx.subscription.create({
          data: {
            userId,
            planId,
            ...(coachId && { coachId }),
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            mercadopagoPaymentId: paymentId,
            paymentMethod: 'mercadopago',
            cancelAtPeriodEnd: false
          }
        })

    // Actualizar el registro de pago pendiente existente (creado al generar la preferencia)
    if (preferenceId) {
      const updated = await tx.paymentHistory.updateMany({
        where: { mercadopagoPreferenceId: preferenceId },
        data: {
          status: 'approved',
          subscriptionId: subscription.id,
          mercadopagoPaymentId: paymentId
        }
      })

      // Si no había registro previo, crear uno nuevo
      if (updated.count === 0) {
        await tx.paymentHistory.create({
          data: {
            userId,
            subscriptionId: subscription.id,
            amount: Number(plan.price),
            currency: plan.currency,
            status: 'approved',
            recipientType: 'coach',
            mercadopagoPaymentId: paymentId,
            ...(preferenceId && { mercadopagoPreferenceId: preferenceId }),
            paymentMethod: 'mercadopago'
          }
        })
      }
    }

    // Resetear preferencias para el nuevo período
    await tx.userPreference.updateMany({
      where: { userId },
      data: { lastPreferenceChangeDate: null }
    })
  })
}
