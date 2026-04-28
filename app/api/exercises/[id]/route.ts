import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH /api/exercises/[id]
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
    const exerciseId = parseInt(params.id)

    if (isNaN(exerciseId)) {
      return NextResponse.json(
        { error: 'ID de ejercicio inválido' },
        { status: 400 }
      )
    }

    const existing = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, coachId: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Ejercicio no encontrado' },
        { status: 404 }
      )
    }

    if (existing.coachId !== coachId) {
      return NextResponse.json(
        { error: 'No autorizado. Este ejercicio no pertenece a tu cuenta.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.category !== undefined)
      updateData.category = body.category?.trim() || null
    if (body.description !== undefined)
      updateData.description = body.description?.trim() || null
    if (body.video_url !== undefined)
      updateData.videoUrl = body.video_url?.trim() || null
    if (body.image_url !== undefined)
      updateData.imageUrl = body.image_url?.trim() || null
    if (body.is_active !== undefined) updateData.isActive = body.is_active

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    const updated = await prisma.exercise.update({
      where: { id: exerciseId },
      data: updateData,
    })

    return NextResponse.json({
      id: String(updated.id),
      name: updated.name,
      category: updated.category,
      description: updated.description,
      video_url: updated.videoUrl,
      image_url: updated.imageUrl,
      is_active: updated.isActive,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json(
      { error: 'Error al actualizar ejercicio' },
      { status: 500 }
    )
  }
}

// DELETE /api/exercises/[id] (soft delete)
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

    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const exerciseId = parseInt(params.id)

    if (isNaN(exerciseId)) {
      return NextResponse.json(
        { error: 'ID de ejercicio inválido' },
        { status: 400 }
      )
    }

    const existing = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, coachId: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Ejercicio no encontrado' },
        { status: 404 }
      )
    }

    if (existing.coachId !== coachId) {
      return NextResponse.json(
        { error: 'No autorizado. Este ejercicio no pertenece a tu cuenta.' },
        { status: 403 }
      )
    }

    await prisma.exercise.update({
      where: { id: exerciseId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json(
      { error: 'Error al eliminar ejercicio' },
      { status: 500 }
    )
  }
}
