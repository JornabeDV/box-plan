import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json(null)
    }

    // Transformar a formato snake_case para consistencia con el frontend
    const transformedSubscription = {
      id: subscription.id.toString(),
      user_id: subscription.userId.toString(),
      plan_id: subscription.planId.toString(),
      status: subscription.status,
      current_period_start: subscription.currentPeriodStart.toISOString(),
      current_period_end: subscription.currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancelAtPeriodEnd,
      mercadopago_subscription_id: null,
      mercadopago_payment_id: subscription.mercadopagoPaymentId || null,
      created_at: subscription.createdAt.toISOString(),
      updated_at: subscription.updatedAt.toISOString(),
      subscription_plans: subscription.plan ? {
        name: subscription.plan.name,
        price: Number(subscription.plan.price),
        features: subscription.plan.features
      } : undefined
    }
    
    return NextResponse.json(transformedSubscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}