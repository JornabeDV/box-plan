import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'
import {
  getCoachPlanificationWeeks,
  canCoachLoadMonthlyPlanifications,
  canCoachLoadUnlimitedPlanifications,
  canCoachCreatePersonalizedPlanifications,
} from '@/lib/coach-plan-features'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================
// Helpers de transformación
// ============================================================

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

// ============================================================
// GET
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const coachIdParam = searchParams.get('coachId')

    // Si se proporciona coachId, es una petición del admin dashboard (coach)
    if (coachIdParam) {
      const authCheck = await isCoach(userId)
      if (!authCheck.isAuthorized || !authCheck.profile) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      const coachId = parseInt(coachIdParam, 10)
      if (isNaN(coachId) || coachId !== authCheck.profile.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      const planifications = await prisma.planification.findMany({
        where: { coachId },
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
        orderBy: { date: 'desc' },
      })

      const transformed = planifications.map(transformPlanificationResponse)
      return NextResponse.json(transformed)
    }

    // Caso original: estudiante obteniendo planificación de su coach
    const relationship = await prisma.coachStudentRelationship.findFirst({
      where: { studentId: userId, status: 'active' },
      include: { coach: { select: { id: true } } },
    })

    if (!relationship) {
      return NextResponse.json({
        data: null,
        message: 'El usuario no está asociado a ningún coach activo',
      })
    }

    const coachId = relationship.coach.id

    const userDisciplines = await prisma.userDiscipline.findMany({
      where: { userId },
      include: {
        discipline: { select: { id: true, name: true, color: true } },
        level: { select: { id: true, name: true } },
      },
    })

    const preference =
      userDisciplines.length === 0
        ? await prisma.userPreference.findUnique({
            where: { userId },
            select: {
              preferredDisciplineId: true,
              preferredLevelId: true,
            },
          })
        : null

    let disciplineLevelCombinations: {
      disciplineId: number
      levelId: number | null
    }[] = []

    const levelIdParam = searchParams.get('levelId')
    const disciplineIdParam = searchParams.get('disciplineId')
    let selectedLevelId: number | null = null
    let selectedDisciplineId: number | null = null

    if (levelIdParam) {
      selectedLevelId = parseInt(levelIdParam, 10)
      if (isNaN(selectedLevelId)) selectedLevelId = null
    }

    if (disciplineIdParam) {
      selectedDisciplineId = parseInt(disciplineIdParam, 10)
      if (isNaN(selectedDisciplineId)) selectedDisciplineId = null
    }

    if (selectedDisciplineId) {
      const userDiscipline = userDisciplines.find(
        (ud) => ud.disciplineId === selectedDisciplineId
      )
      disciplineLevelCombinations = [
        {
          disciplineId: selectedDisciplineId,
          levelId: selectedLevelId ?? userDiscipline?.levelId ?? null,
        },
      ]
    } else if (userDisciplines.length > 0) {
      disciplineLevelCombinations = userDisciplines.map((ud) => ({
        disciplineId: ud.disciplineId,
        levelId: ud.levelId,
      }))
    } else if (preference?.preferredDisciplineId) {
      disciplineLevelCombinations = [
        {
          disciplineId: preference.preferredDisciplineId,
          levelId:
            selectedLevelId ?? preference.preferredLevelId ?? null,
        },
      ]
    }

    if (disciplineLevelCombinations.length === 0) {
      return NextResponse.json({
        data: null,
        needsPreference: true,
        message: 'El usuario no tiene disciplinas asignadas',
      })
    }

    const validCombinations = disciplineLevelCombinations.filter(
      (c) => c.levelId !== null
    )

    if (validCombinations.length === 0) {
      return NextResponse.json({
        data: null,
        needsLevel: true,
        disciplineId: disciplineLevelCombinations[0]?.disciplineId,
        message:
          'El usuario necesita tener niveles asignados a sus disciplinas para ver las planificaciones',
      })
    }

    const dateParam = searchParams.get('date')
    let dateStr: string
    if (dateParam) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(dateParam)) {
        dateStr = dateParam
      } else {
        const today = new Date()
        dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      }
    } else {
      const today = new Date()
      dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    }

    const normalizedDate = normalizeDateForArgentina(dateStr)
    const [year, month, day] = dateStr.split('-').map(Number)
    const nextDayStr = new Date(year, month - 1, day + 1)
      .toISOString()
      .split('T')[0]
    const endOfDay = normalizeDateForArgentina(nextDayStr)

    const personalizedPlanification = await prisma.planification.findFirst({
      where: {
        coachId,
        targetUserId: userId,
        isPersonalized: true,
        date: { gte: normalizedDate, lt: endOfDay },
      },
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
      orderBy: { date: 'asc' },
    })

    let planification = null

    if (personalizedPlanification) {
      const studentSubscription = await prisma.subscription.findFirst({
        where: { userId, status: 'active' },
        include: { plan: { select: { features: true } } },
      })

      let studentFeatures: { personalizedWorkouts?: boolean } | null = null
      const rawFeatures = studentSubscription?.plan?.features
      if (typeof rawFeatures === 'string') {
        try {
          studentFeatures = JSON.parse(rawFeatures)
        } catch (e) {
          console.error('Error parsing features:', e)
        }
      } else if (rawFeatures && typeof rawFeatures === 'object') {
        studentFeatures = rawFeatures as { personalizedWorkouts?: boolean }
      }

      if (studentFeatures?.personalizedWorkouts === true) {
        planification = personalizedPlanification
      }
    }

    if (!planification) {
      planification = await prisma.planification.findFirst({
        where: {
          coachId,
          isPersonalized: false,
          date: { gte: normalizedDate, lt: endOfDay },
          OR: validCombinations.map((combo) => ({
            disciplineId: combo.disciplineId,
            disciplineLevelId: combo.levelId,
          })),
        },
        include: {
          discipline: { select: { id: true, name: true, color: true } },
          disciplineLevel: {
            select: { id: true, name: true, description: true },
          },
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
        orderBy: { date: 'asc' },
      })
    }

    if (!planification) {
      return NextResponse.json({
        data: null,
        disciplineId: validCombinations[0]?.disciplineId ?? null,
        message: `No hay planificación para ${dateParam ? 'esa fecha' : 'hoy'} con tus disciplinas y niveles`,
      })
    }

    return NextResponse.json({
      data: transformPlanificationResponse(planification),
    })
  } catch (error) {
    console.error('Error fetching planification:', error)
    return NextResponse.json(
      { error: 'Error al cargar la planificación' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json(
        { error: 'No autorizado. Solo coaches pueden crear planificaciones.' },
        { status: 403 }
      )
    }

    const coachId = authCheck.profile.id
    const body = await request.json()

    const isPersonalized = body.is_personalized || false
    const targetUserId = body.target_user_id || null

    if (isPersonalized && !targetUserId) {
      return NextResponse.json(
        { error: 'target_user_id es requerido para planificaciones personalizadas' },
        { status: 400 }
      )
    }

    if (isPersonalized && targetUserId) {
      const targetUserIdNum =
        typeof targetUserId === 'string'
          ? parseInt(targetUserId, 10)
          : targetUserId

      if (isNaN(targetUserIdNum)) {
        return NextResponse.json(
          { error: 'target_user_id inválido' },
          { status: 400 }
        )
      }

      const relationship = await prisma.coachStudentRelationship.findFirst({
        where: {
          coachId,
          studentId: targetUserIdNum,
          status: 'active',
        },
      })

      if (!relationship) {
        return NextResponse.json(
          { error: 'El usuario especificado no es tu estudiante' },
          { status: 403 }
        )
      }

      const canCreatePersonalized = await canCoachCreatePersonalizedPlanifications(coachId)
      if (!canCreatePersonalized) {
        return NextResponse.json(
          { error: 'Tu plan no incluye planificaciones personalizadas. Actualiza tu plan para acceder a esta función.' },
          { status: 403 }
        )
      }

      const studentSubscription = await prisma.subscription.findFirst({
        where: { userId: targetUserIdNum, status: 'active' },
        include: { plan: { select: { features: true } } },
      })

      const studentFeatures = studentSubscription?.plan?.features as
        | { personalizedWorkouts?: boolean }
        | null

      if (!studentFeatures?.personalizedWorkouts) {
        return NextResponse.json(
          { error: 'El estudiante no tiene habilitadas las planificaciones personalizadas en su plan actual' },
          { status: 403 }
        )
      }

      const dateStr =
        typeof body.date === 'string'
          ? body.date
          : body.date.toISOString().split('T')[0]
      const normalizedDateCheck = normalizeDateForArgentina(dateStr)

      const existingPersonalized = await prisma.planification.findFirst({
        where: {
          coachId,
          targetUserId: targetUserIdNum,
          isPersonalized: true,
          date: normalizedDateCheck,
        },
      })

      if (existingPersonalized) {
        return NextResponse.json(
          { error: 'Ya existe una planificación personalizada para este usuario en esta fecha' },
          { status: 409 }
        )
      }
    }

    if (!isPersonalized) {
      if (!body.discipline_id) {
        return NextResponse.json(
          { error: 'ID de disciplina requerido' },
          { status: 400 }
        )
      }
      if (!body.discipline_level_id) {
        return NextResponse.json(
          { error: 'ID de nivel de disciplina requerido' },
          { status: 400 }
        )
      }
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'Fecha requerida' },
        { status: 400 }
      )
    }

    const disciplineIdNum = body.discipline_id
      ? typeof body.discipline_id === 'string'
        ? parseInt(body.discipline_id, 10)
        : body.discipline_id
      : null
    const disciplineLevelIdNum = body.discipline_level_id
      ? typeof body.discipline_level_id === 'string'
        ? parseInt(body.discipline_level_id, 10)
        : body.discipline_level_id
      : null

    if (disciplineIdNum && isNaN(disciplineIdNum)) {
      return NextResponse.json(
        { error: 'ID de disciplina inválido' },
        { status: 400 }
      )
    }

    if (disciplineLevelIdNum && isNaN(disciplineLevelIdNum)) {
      return NextResponse.json(
        { error: 'ID de nivel de disciplina inválido' },
        { status: 400 }
      )
    }

    const dateStr =
      typeof body.date === 'string'
        ? body.date
        : body.date.toISOString().split('T')[0]
    const normalizedDate = normalizeDateForArgentina(dateStr)

    // Validar límite de días hacia adelante según el plan del coach
    try {
      const planificationWeeks = await getCoachPlanificationWeeks(coachId)
      const canLoadMonthly = await canCoachLoadMonthlyPlanifications(coachId)
      const canLoadUnlimited = await canCoachLoadUnlimitedPlanifications(coachId)

      const [year, month, day] = dateStr.split('-').map(Number)
      const planificationDate = new Date(year, month - 1, day)
      const today = new Date()
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const diffTime = planificationDate.getTime() - todayDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (canLoadUnlimited) {
        if (diffDays < 0) {
          return NextResponse.json(
            { error: 'No puedes crear planificaciones en el pasado' },
            { status: 403 }
          )
        }
      } else if (canLoadMonthly) {
        if (diffDays < 0) {
          return NextResponse.json(
            { error: 'No puedes crear planificaciones en el pasado' },
            { status: 403 }
          )
        }
        if (diffDays > 30) {
          return NextResponse.json(
            { error: 'Tu plan solo permite cargar planificaciones hasta 30 días adelante' },
            { status: 403 }
          )
        }
      } else if (planificationWeeks > 0) {
        const maxDays = planificationWeeks * 7
        if (diffDays < 0) {
          return NextResponse.json(
            { error: 'No puedes crear planificaciones en el pasado' },
            { status: 403 }
          )
        }
        if (diffDays > maxDays) {
          return NextResponse.json(
            { error: `Tu plan solo permite cargar planificaciones hasta ${planificationWeeks} semana${planificationWeeks !== 1 ? 's' : ''} (${maxDays} días) adelante` },
            { status: 403 }
          )
        }
      } else {
        if (diffDays !== 0) {
          return NextResponse.json(
            { error: 'Tu plan solo permite cargar planificaciones para el día actual' },
            { status: 403 }
          )
        }
      }
    } catch (planError) {
      console.error('Error al validar límite de planificación:', planError)
    }

    const targetUserIdNum = targetUserId
      ? typeof targetUserId === 'string'
        ? parseInt(targetUserId, 10)
        : targetUserId
      : null

    const blocksData = body.blocks || body.exercises || []

    // Crear planificación y bloques en transacción
    const createdPlanification = await prisma.$transaction(async (tx) => {
      const planification = await tx.planification.create({
        data: {
          coachId,
          disciplineId: disciplineIdNum,
          disciplineLevelId: disciplineLevelIdNum,
          date: normalizedDate,
          title: body.title || null,
          description: body.description || null,
          notes: body.notes || null,
          isCompleted: body.is_completed || false,
          isPersonalized: isPersonalized,
          targetUserId: targetUserIdNum,
        },
        include: {
          discipline: { select: { id: true, name: true, color: true } },
          disciplineLevel: {
            select: { id: true, name: true, description: true },
          },
          targetUser: { select: { id: true, name: true, email: true } },
        },
      })

      for (const block of blocksData) {
        const createdBlock = await tx.planificationBlock.create({
          data: {
            planificationId: planification.id,
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

      return planification
    })

    // Recuperar la planificación completa con relaciones para la respuesta
    const fullPlanification = await prisma.planification.findUnique({
      where: { id: createdPlanification.id },
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

    return NextResponse.json(
      transformPlanificationResponse(fullPlanification),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating planification:', error)

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Disciplina o nivel no encontrado' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear planificación' },
      { status: 500 }
    )
  }
}
