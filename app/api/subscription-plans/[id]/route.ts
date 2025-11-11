import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach } from '@/lib/auth-helpers'

// PATCH /api/subscription-plans/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(session.user.id)

    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const planId = parseInt(params.id)
    const body = await request.json()
    const { name, description, price, currency, interval, features, is_active } = body

    // Verificar que hay al menos un campo para actualizar
    const hasUpdates = name !== undefined || 
                      description !== undefined || 
                      (price !== undefined && price !== null) || 
                      currency !== undefined || 
                      interval !== undefined || 
                      features !== undefined || 
                      is_active !== undefined

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
      features: plan.features,
      is_active: plan.isActive,
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
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(session.user.id)

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
      features: plan.features,
      is_active: plan.isActive,
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