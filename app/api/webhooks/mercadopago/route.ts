import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { sendPushNotification, sendPushToUsers } from '@/lib/push-notifications'
import { decryptToken } from '@/lib/crypto'

// ---------------------------------------------------------------------------
// Signature validation
// ---------------------------------------------------------------------------

/**
 * Valida la firma HMAC-SHA256 que MercadoPago envía en el header x-signature.
 * Formato del header: "ts=<timestamp>,v1=<hash>"
 * El dato firmado es: "id:<paymentId>;request-id:<requestId>;ts:<ts>"
 *
 * Si MERCADOPAGO_WEBHOOK_SECRET no está configurado, se rechaza el webhook
 * para evitar procesar notificaciones de origen desconocido.
 */
function validateWebhookSignature(request: NextRequest, paymentId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.error('MERCADOPAGO_WEBHOOK_SECRET not configured — rejecting webhook')
    return false
  }

  const signatureHeader = request.headers.get('x-signature')
  const requestId = request.headers.get('x-request-id') ?? ''

  if (!signatureHeader) {
    console.error('Missing x-signature header in webhook request')
    return false
  }

  // Parsear "ts=<ts>,v1=<hash>"
  const parts: Record<string, string> = {}
  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.split('=')
    if (key && value) parts[key.trim()] = value.trim()
  }

  const { ts, v1 } = parts
  if (!ts || !v1) {
    console.error('Malformed x-signature header:', signatureHeader)
    return false
  }

  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts}`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  if (expected !== v1) {
    console.error('Webhook signature mismatch — possible spoofed request')
    return false
  }

  return true
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body: { data: { id: string } | string; type: string } = await request.json()

    if (body.type === 'payment') {
      const paymentId = typeof body.data === 'string' ? body.data : body.data.id

      if (!validateWebhookSignature(request, paymentId)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }

      await handlePayment(paymentId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error en webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// Payment info fetching
// ---------------------------------------------------------------------------

interface PaymentInfo {
  user_id?: string
  plan_id?: string
  coach_id?: string
  status?: string
  preferenceId?: string
  transactionAmount?: number
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
        preferenceId: (payment as any).preference_id,
        transactionAmount: (payment as any).transaction_amount ?? undefined
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
      const token = decryptToken(coach.mercadoPagoAccessToken!)
      const client = new MercadoPagoConfig({ accessToken: token })
      const payment = await new Payment(client).get({ id: paymentId })
      return {
        ...(payment.metadata || {}),
        status: payment.status ?? undefined,
        preferenceId: (payment as any).preference_id,
        transactionAmount: (payment as any).transaction_amount ?? undefined
      }
    } catch {
      continue
    }
  }

  return {}
}

// ---------------------------------------------------------------------------
// Payment handling
// ---------------------------------------------------------------------------

async function handlePayment(paymentId: string) {
  // --- Idempotencia: evitar procesar el mismo pago dos veces ---
  const alreadyProcessed = await prisma.paymentHistory.findFirst({
    where: { mercadopagoPaymentId: paymentId, status: 'approved' }
  })
  if (alreadyProcessed) {
    console.log(`Payment ${paymentId} already processed — skipping`)
    return
  }

  const info = await fetchPaymentInfo(paymentId)
  const { user_id, plan_id, coach_id, status, preferenceId, transactionAmount } = info

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

  await createSubscription({ userId, planId, coachId, paymentId, preferenceId, transactionAmount })
}

// ---------------------------------------------------------------------------
// Subscription creation
// ---------------------------------------------------------------------------

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
  preferenceId,
  transactionAmount
}: {
  userId: number
  planId: number
  coachId: number | null
  paymentId: string
  preferenceId?: string
  transactionAmount?: number
}) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  })

  if (!plan) {
    throw new Error(`Plan ${planId} no encontrado`)
  }

  // --- Validar monto del pago ---
  const expectedAmount = Number(plan.price)
  if (transactionAmount !== undefined && Math.abs(transactionAmount - expectedAmount) > 0.01) {
    console.error('Payment amount mismatch — rejecting', {
      paymentId,
      expected: expectedAmount,
      received: transactionAmount
    })
    if (preferenceId) {
      await prisma.paymentHistory.updateMany({
        where: { mercadopagoPreferenceId: preferenceId },
        data: { status: 'rejected', mercadopagoPaymentId: paymentId }
      })
    }
    return
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

    // Actualizar o crear el registro de pago
    if (preferenceId) {
      const updated = await tx.paymentHistory.updateMany({
        where: { mercadopagoPreferenceId: preferenceId },
        data: {
          status: 'approved',
          subscriptionId: subscription.id,
          mercadopagoPaymentId: paymentId
        }
      })

      if (updated.count === 0) {
        await tx.paymentHistory.create({
          data: {
            userId,
            subscriptionId: subscription.id,
            amount: expectedAmount,
            currency: plan.currency,
            status: 'approved',
            recipientType: 'coach',
            mercadopagoPaymentId: paymentId,
            mercadopagoPreferenceId: preferenceId,
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

  // Enviar notificación push al estudiante (fuera de la transacción)
  await notifyStudent(userId, plan.name, periodEnd)

  // Enviar notificación push al coach (fuera de la transacción)
  if (coachId) {
    await notifyCoach(coachId, userId, transactionAmount, plan.name)
  }
}

// ---------------------------------------------------------------------------
// Push notification
// ---------------------------------------------------------------------------

async function notifyStudent(userId: number, planName: string, periodEnd: Date) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    if (subscriptions.length === 0) return

    const expiryDate = periodEnd.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const stale: string[] = []

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          {
            title: '¡Pago confirmado! ✅',
            body: `Tu plan ${planName} está activo hasta el ${expiryDate}. ¡A entrenar!`,
            icon: '/icon-192.jpg',
            url: '/planification'
          }
        )
        if (result.error === 'gone') stale.push(sub.endpoint)
      })
    )

    if (stale.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: stale } } })
    }
  } catch (err) {
    console.error('Error sending push notification after payment:', err)
  }
}

async function notifyCoach(
  coachId: number,
  studentId: number,
  amount: number | undefined,
  planName: string
) {
  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, email: true }
    })

    const studentName = student?.name || student?.email || 'Un alumno'
    const amountText = amount !== undefined
      ? `$${amount.toLocaleString('es-AR')}`
      : ''

    await sendPushToUsers(coachId, {
      title: '💰 Nuevo pago recibido',
      body: amountText
        ? `${studentName} pagó ${amountText} por el plan ${planName}.`
        : `${studentName} se suscribió al plan ${planName}.`,
      icon: '/icon-192.jpg',
      url: '/admin-dashboard'
    })
  } catch (err) {
    console.error('Error sending push notification to coach after payment:', err)
  }
}
