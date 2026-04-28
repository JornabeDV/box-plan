import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'

function normalizeItem(item: any): {
  description: string
  exerciseId: number | null
} {
  if (typeof item === 'string') {
    return { description: item, exerciseId: null }
  }
  return {
    description: item.description || item.text || '',
    exerciseId: item.exerciseId
      ? typeof item.exerciseId === 'string'
        ? parseInt(item.exerciseId, 10)
        : item.exerciseId
      : null,
  }
}

function transformItem(item: any) {
  return {
    id: String(item.id),
    description: item.description,
    order: item.order,
    exercise: item.exercise
      ? {
          id: String(item.exercise.id),
          name: item.exercise.name,
          category: item.exercise.category,
          video_url: item.exercise.videoUrl,
          image_url: item.exercise.imageUrl,
        }
      : null,
  }
}

function transformSubBlock(subBlock: any) {
  return {
    id: String(subBlock.id),
    subtitle: subBlock.subtitle,
    order: subBlock.order,
    timer_mode: subBlock.timerMode || null,
    timer_config: subBlock.timerConfig || undefined,
    items: subBlock.items?.map(transformItem) || [],
  }
}

function transformBlock(block: any) {
  return {
    id: String(block.id),
    title: block.title,
    order: block.order,
    notes: block.notes || undefined,
    timer_mode: block.timerMode || null,
    timer_config: block.timerConfig || undefined,
    items: block.items?.map(transformItem) || [],
    subBlocks: block.subBlocks?.map(transformSubBlock) || [],
  }
}

function transformPlanificationResponse(p: any) {
  const dateObj = p.date instanceof Date ? p.date : new Date(p.date)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const normalizedDate = `${year}-${month}-${day}`

  return {
    id: String(p.id),
    coach_id: String(p.coachId),
    discipline_id: p.disciplineId ? String(p.disciplineId) : null,
    discipline_level_id: p.disciplineLevelId
      ? String(p.disciplineLevelId)
      : null,
    date: normalizedDate,
    title: p.title,
    description: p.description,
    blocks: p.blocks?.map(transformBlock) || [],
    notes: p.notes,
    is_active: !p.isCompleted,
    is_completed: p.isCompleted,
    is_personalized: p.isPersonalized || false,
    target_user_id: p.targetUserId ? String(p.targetUserId) : null,
    target_user: p.targetUser
      ? {
          id: String(p.targetUser.id),
          name: p.targetUser.name,
          email: p.targetUser.email,
        }
      : null,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
    discipline: p.discipline
      ? {
          id: String(p.discipline.id),
          name: p.discipline.name,
          color: p.discipline.color,
        }
      : null,
    discipline_level: p.disciplineLevel
      ? {
          id: String(p.disciplineLevel.id),
          name: p.disciplineLevel.name,
          description: p.disciplineLevel.description,
        }
      : null,
  }
}

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

    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const planificationId = parseInt(params.id)
    const body = await request.json()

    const existing = await prisma.planification.findUnique({
      where: { id: planificationId },
      select: { id: true, coachId: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Planificación no encontrada' },
        { status: 404 }
      )
    }

    if (existing.coachId !== coachId) {
      return NextResponse.json(
        { error: 'No autorizado. Esta planificación no pertenece a tu cuenta.' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (body.discipline_id !== undefined) {
      const disciplineIdNum =
        typeof body.discipline_id === 'string'
          ? parseInt(body.discipline_id, 10)
          : body.discipline_id
      updateData.disciplineId = isNaN(disciplineIdNum) ? null : disciplineIdNum
    }
    if (body.discipline_level_id !== undefined) {
      const disciplineLevelIdNum =
        typeof body.discipline_level_id === 'string'
          ? parseInt(body.discipline_level_id, 10)
          : body.discipline_level_id
      updateData.disciplineLevelId = isNaN(disciplineLevelIdNum)
        ? null
        : disciplineLevelIdNum
    }
    if (body.date !== undefined) {
      updateData.date =
        typeof body.date === 'string'
          ? normalizeDateForArgentina(body.date)
          : new Date(body.date)
    }
    if (body.title !== undefined) updateData.title = body.title || null
    if (body.description !== undefined)
      updateData.description = body.description || null
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.is_completed !== undefined)
      updateData.isCompleted = body.is_completed

    const blocksData = body.blocks || body.exercises || null

    // Ejecutar actualización en transacción
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar campos simples
      await tx.planification.update({
        where: { id: planificationId },
        data: updateData,
      })

      // 2. Si hay bloques, eliminar los existentes y recrear
      if (blocksData !== null) {
        // Eliminar bloques existentes (cascade elimina subBlocks e items)
        await tx.planificationBlock.deleteMany({
          where: { planificationId },
        })

        // Recrear bloques
        for (const block of blocksData) {
          const createdBlock = await tx.planificationBlock.create({
            data: {
              planificationId,
              title: block.title || '',
              order: block.order ?? 0,
              notes: block.notes || null,
              timerMode: block.timer_mode || null,
              timerConfig: block.timer_config || null,
            },
          })

          const items = block.items || []
          for (let i = 0; i < items.length; i++) {
            const normalized = normalizeItem(items[i])
            await tx.planificationItem.create({
              data: {
                blockId: createdBlock.id,
                description: normalized.description,
                exerciseId: normalized.exerciseId,
                order: i,
              },
            })
          }

          const subBlocks = block.subBlocks || []
          for (const subBlock of subBlocks) {
            const createdSubBlock = await tx.planificationSubBlock.create({
              data: {
                blockId: createdBlock.id,
                subtitle: subBlock.subtitle || '',
                order: subBlock.order ?? 0,
                timerMode: subBlock.timer_mode || null,
                timerConfig: subBlock.timer_config || null,
              },
            })

            const subItems = subBlock.items || []
            for (let i = 0; i < subItems.length; i++) {
              const normalized = normalizeItem(subItems[i])
              await tx.planificationItem.create({
                data: {
                  subBlockId: createdSubBlock.id,
                  description: normalized.description,
                  exerciseId: normalized.exerciseId,
                  order: i,
                },
              })
            }
          }
        }
      }
    })

    // Obtener la planificación actualizada con relaciones
    const updated = await prisma.planification.findUnique({
      where: { id: planificationId },
      include: {
        discipline: { select: { id: true, name: true, color: true } },
        disciplineLevel: {
          select: { id: true, name: true, description: true },
        },
        targetUser: { select: { id: true, name: true, email: true } },
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              orderBy: { order: 'asc' },
              include: { exercise: true },
            },
            subBlocks: {
              orderBy: { order: 'asc' },
              include: {
                items: {
                  orderBy: { order: 'asc' },
                  include: { exercise: true },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(transformPlanificationResponse(updated))
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

    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const planificationId = parseInt(params.id)

    const existing = await prisma.planification.findUnique({
      where: { id: planificationId },
      select: { id: true, coachId: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Planificación no encontrada' },
        { status: 404 }
      )
    }

    if (existing.coachId !== coachId) {
      return NextResponse.json(
        { error: 'No autorizado. Esta planificación no pertenece a tu cuenta.' },
        { status: 403 }
      )
    }

    try {
      await prisma.planification.delete({
        where: { id: planificationId },
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
