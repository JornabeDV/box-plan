import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/subscription-plans/shared/[token]
// Endpoint público para acceder a un plan personalizado mediante su shareToken.
// Solo planes personalizados, activos y con shareToken pueden ser consultados.
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { shareToken: token },
      include: {
        coach: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            user: { select: { name: true, email: true } }
          }
        },
        _count: { select: { subscriptions: true } }
      }
    })

    if (!plan || !plan.isActive || !plan.isPersonalized) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    const serializedPlan = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: Number(plan.price),
      currency: plan.currency,
      interval: plan.interval,
      tier: plan.tier,
      planificationAccess: plan.planificationAccess,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      is_active: plan.isActive,
      is_personalized: plan.isPersonalized,
      share_token: plan.shareToken,
      coach: plan.coach,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString()
    }

    const response = NextResponse.json(serializedPlan)
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=15')
    return response
  } catch (error: any) {
    console.error('Error fetching shared subscription plan:', error)
    return NextResponse.json(
      { error: 'Error al cargar el plan' },
      { status: 500 }
    )
  }
}
