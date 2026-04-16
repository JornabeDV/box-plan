import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/subscriptions/current
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Buscar suscripción activa o expirada (para mostrar info de renovación)
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'expired'] }
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            interval: true,
            features: true,
            planificationAccess: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!subscription) {
      return NextResponse.json({ data: null })
    }

    const now = new Date()
    const isExpired = subscription.currentPeriodEnd < now

    // Auto-expirar en DB si sigue marcada como active pero ya venció
    if (subscription.status === 'active' && isExpired) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' }
      })
    }

    const result = {
      id: subscription.id,
      user_id: subscription.userId,
      plan_id: subscription.planId,
      status: isExpired ? 'expired' : subscription.status,
      current_period_start: subscription.currentPeriodStart.toISOString(),
      current_period_end: subscription.currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancelAtPeriodEnd,
      mercadopago_payment_id: subscription.mercadopagoPaymentId,
      payment_method: subscription.paymentMethod || null,
      created_at: subscription.createdAt.toISOString(),
      updated_at: subscription.updatedAt.toISOString(),
      is_expired: isExpired,
      subscription_plans: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        price: Number(subscription.plan.price),
        currency: subscription.plan.currency,
        interval: subscription.plan.interval,
        features: subscription.plan.features,
        planificationAccess: subscription.plan.planificationAccess
      }
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error fetching current subscription:', error)
    return NextResponse.json(
      { error: 'Error al cargar la suscripción' },
      { status: 500 }
    )
  }
}
