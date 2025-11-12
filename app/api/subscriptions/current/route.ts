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

    // Buscar suscripción activa del usuario
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      },
      include: {
        plan: {
          select: {
            name: true,
            price: true,
            features: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!subscription) {
      return NextResponse.json({ data: null })
    }

    // Transformar para respuesta
    const result = {
      id: subscription.id,
      user_id: subscription.userId,
      plan_id: subscription.planId,
      status: subscription.status,
      current_period_start: subscription.currentPeriodStart.toISOString(),
      current_period_end: subscription.currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancelAtPeriodEnd,
      mercadopago_payment_id: subscription.mercadopagoPaymentId,
      created_at: subscription.createdAt.toISOString(),
      updated_at: subscription.updatedAt.toISOString(),
      subscription_plans: {
        name: subscription.plan.name,
        price: Number(subscription.plan.price),
        features: subscription.plan.features
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