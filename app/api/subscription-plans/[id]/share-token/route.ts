import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'
import { nanoid } from 'nanoid'

// PATCH /api/subscription-plans/[id]/share-token
// Genera o regenera el shareToken de un plan personalizado.
// Solo el coach dueño del plan puede ejecutarlo.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const planId = parseInt(params.id, 10)
    if (isNaN(planId)) {
      return NextResponse.json({ error: 'ID de plan inválido' }, { status: 400 })
    }

    const currentPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true, coachId: true, isPersonalized: true, shareToken: true }
    })

    if (!currentPlan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    if (currentPlan.coachId !== coachId) {
      return NextResponse.json({ error: 'No autorizado. Este plan no pertenece a tu cuenta.' }, { status: 403 })
    }

    if (!currentPlan.isPersonalized) {
      return NextResponse.json({ error: 'Solo los planes personalizados tienen link de compartir' }, { status: 400 })
    }

    // Si ya tiene token, lo devolvemos tal cual; si no, generamos uno nuevo.
    const newShareToken = currentPlan.shareToken || nanoid(24)

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { shareToken: newShareToken }
    })

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
      shareToken: plan.shareToken,
      share_token: plan.shareToken,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString()
    }

    return NextResponse.json(serializedPlan)
  } catch (error: any) {
    console.error('Error regenerating share token:', error)
    return NextResponse.json(
      { error: 'Error al generar el link de compartir' },
      { status: 500 }
    )
  }
}
