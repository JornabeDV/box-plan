import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

// PATCH /api/planifications/[id]
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
    const planificationId = parseInt(params.id)
    const body = await request.json()

    // Verificar que la planificación existe y pertenece al coach
    const existing = await prisma.planification.findUnique({
      where: { id: planificationId },
      select: { id: true, coachId: true }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Planificación no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la planificación pertenece al coach autenticado
    if (existing.coachId !== coachId) {
      return NextResponse.json(
        { error: 'No autorizado. Esta planificación no pertenece a tu cuenta.' },
        { status: 403 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {}
    if (body.discipline_id !== undefined) updateData.disciplineId = body.discipline_id || null
    if (body.discipline_level_id !== undefined) updateData.disciplineLevelId = body.discipline_level_id || null
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.title !== undefined) updateData.title = body.title || null
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.exercises !== undefined) updateData.exercises = body.exercises || null
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.is_completed !== undefined) updateData.isCompleted = body.is_completed

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    // Actualizar y obtener con relaciones
    const updated = await prisma.planification.update({
      where: { id: planificationId },
      data: updateData,
      include: {
        discipline: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        disciplineLevel: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    const transformed = {
      ...updated,
      discipline: updated.discipline ? {
        id: updated.discipline.id,
        name: updated.discipline.name,
        color: updated.discipline.color
      } : null,
      discipline_level: updated.disciplineLevel ? {
        id: updated.disciplineLevel.id,
        name: updated.disciplineLevel.name,
        description: updated.disciplineLevel.description
      } : null
    }

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error updating planification:', error)
    return NextResponse.json(
      { error: 'Error al actualizar planificación' },
      { status: 500 }
    )
  }
}

// DELETE /api/planifications/[id]
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
    const planificationId = parseInt(params.id)

    // Verificar que la planificación existe y pertenece al coach
    const existing = await prisma.planification.findUnique({
      where: { id: planificationId },
      select: { id: true, coachId: true }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Planificación no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la planificación pertenece al coach autenticado
    if (existing.coachId !== coachId) {
      return NextResponse.json(
        { error: 'No autorizado. Esta planificación no pertenece a tu cuenta.' },
        { status: 403 }
      )
    }

    try {
      await prisma.planification.delete({
        where: { id: planificationId }
      })

      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Planificación no encontrada' },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error deleting planification:', error)
    return NextResponse.json(
      { error: 'Error al eliminar planificación' },
      { status: 500 }
    )
  }
}