import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-server-helpers'
import { nanoid } from 'nanoid'

// GET /api/subscription-plans/[id]
// Endpoint público para obtener un plan específico (usado por links compartibles)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = parseInt(params.id)
    if (isNaN(planId)) {
      return NextResponse.json({ error: 'ID de plan inválido' }, { status: 400 })
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        coach: {
          select: {
            id: true,
            businessName: true,
            user: { select: { name: true } }
          }
        },
        _count: { select: { subscriptions: true } }
      }
    })

    if (!plan || !plan.isActive) {
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
      coach: plan.coach,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString()
    }

    const response = NextResponse.json(serializedPlan)
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=15')
    return response
  } catch (error: any) {
    console.error('Error fetching subscription plan:', error)
    return NextResponse.json(
      { error: 'Error al cargar el plan' },
      { status: 500 }
    )
  }
}

// PATCH /api/subscription-plans/[id]
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

    // Verificar que el usuario es coach
    const authCheck = await isCoach(userId)

    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const planId = parseInt(params.id)
    const body = await request.json()
    const { name, description, price, currency, interval, features, is_active, is_personalized } = body

    // Verificar que hay al menos un campo para actualizar
    const hasUpdates = name !== undefined || 
                      description !== undefined || 
                      (price !== undefined && price !== null) || 
                      currency !== undefined || 
                      interval !== undefined || 
                      features !== undefined || 
                      is_active !== undefined ||
                      is_personalized !== undefined

    if (!hasUpdates) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    // Obtener el plan actual primero y verificar que pertenece al coach
    const currentPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true, coachId: true }
    })

    if (!currentPlan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    // Verificar que el plan pertenece al coach
    if (currentPlan.coachId !== coachId) {
      return NextResponse.json({ error: 'No autorizado. Este plan no pertenece a tu cuenta.' }, { status: 403 })
    }

    // Preparar datos de actualización
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined && price !== null) updateData.price = price
    if (currency !== undefined) updateData.currency = currency
    if (interval !== undefined) updateData.interval = interval
    if (features !== undefined) updateData.features = features
    if (is_active !== undefined) updateData.isActive = is_active
    if (is_personalized !== undefined) {
      updateData.isPersonalized = is_personalized
      // Generar o limpiar shareToken según el estado de personalizado
      if (is_personalized) {
        updateData.shareToken = nanoid(24)
      } else {
        updateData.shareToken = null
      }
    }

    // Actualizar plan
    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData
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
      features: plan.features,
      is_active: plan.isActive,
      is_personalized: plan.isPersonalized,
      share_token: plan.shareToken,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString()
    }

    return NextResponse.json(serializedPlan)
  } catch (error: any) {
    console.error('Error updating subscription plan:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el plan' },
      { status: 500 }
    )
  }
}

// DELETE /api/subscription-plans/[id] - Soft delete (desactivar)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(userId)

    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const planId = parseInt(params.id)

    // Verificar que el plan existe y pertenece al coach
    const currentPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true, coachId: true }
    })

    if (!currentPlan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    // Verificar que el plan pertenece al coach
    if (currentPlan.coachId !== coachId) {
      return NextResponse.json({ error: 'No autorizado. Este plan no pertenece a tu cuenta.' }, { status: 403 })
    }

    // Desactivar el plan
    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { isActive: false }
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
      features: plan.features,
      is_active: plan.isActive,
      is_personalized: plan.isPersonalized,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString()
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plan desactivado exitosamente',
      plan: serializedPlan
    })
  } catch (error: any) {
    console.error('Error deleting subscription plan:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el plan' },
      { status: 500 }
    )
  }
}
