import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================
// Helpers de transformación (copiados de /api/planifications)
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
    rounds: subBlock.rounds || undefined,
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
    rounds: block.rounds || undefined,
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

const planificationInclude = {
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
} as const

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
    const dateParam = searchParams.get('date')

    const relationship = await prisma.coachStudentRelationship.findFirst({
      where: {
        studentId: userId,
        status: { in: ['active', 'Active', 'ACTIVE'] },
      },
      include: { coach: { select: { id: true } } },
    })

    if (!relationship) {
      return NextResponse.json({ data: [] })
    }

    const coachId = relationship.coach.id

    // Verificar primero si el estudiante tiene plan personalizado
    const studentSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'Active', 'ACTIVE'] },
      },
      include: { plan: { select: { features: true } } },
    })

    let hasPersonalizedWorkouts = false
    const rawFeatures = studentSubscription?.plan?.features
    if (typeof rawFeatures === 'string') {
      try {
        const parsed = JSON.parse(rawFeatures)
        hasPersonalizedWorkouts = parsed?.personalizedWorkouts === true
      } catch (e) {
        console.error('Error parsing features:', e)
      }
    } else if (rawFeatures && typeof rawFeatures === 'object') {
      hasPersonalizedWorkouts = (rawFeatures as any)?.personalizedWorkouts === true
    }

    let userDisciplines = await prisma.userDiscipline.findMany({
      where: { userId },
      include: {
        discipline: { select: { id: true, name: true, color: true } },
      },
    })

    // Fallback a preferencias si no tiene disciplinas asignadas
    if (userDisciplines.length === 0) {
      const preference = await prisma.userPreference.findUnique({
        where: { userId },
        select: { preferredDisciplineId: true },
      })

      if (preference?.preferredDisciplineId) {
        const discipline = await prisma.discipline.findUnique({
          where: { id: preference.preferredDisciplineId },
          select: { id: true, name: true, color: true },
        })

        if (discipline) {
          userDisciplines = [
            {
              userId,
              disciplineId: discipline.id,
              levelId: null,
              preferredLevelId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              discipline,
            } as any,
          ]
        }
      }
    }

    // Si no tiene disciplinas ni plan personalizado, no hay nada que mostrar
    if (userDisciplines.length === 0 && !hasPersonalizedWorkouts) {
      return NextResponse.json({ data: [] })
    }

    // Fecha
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

    const disciplineIds = userDisciplines.map((ud) => ud.disciplineId)

    // 1. Buscar planificaciones personalizadas del día para este estudiante
    let personalizedPlanifications: any[] = []
    if (hasPersonalizedWorkouts) {
      personalizedPlanifications = await prisma.planification.findMany({
        where: {
          coachId,
          isPersonalized: true,
          targetUserId: userId,
          date: { gte: normalizedDate, lt: endOfDay },
        },
        include: {
          ...planificationInclude,
          targetUser: { select: { id: true, name: true } },
        },
        orderBy: { date: 'asc' },
      })
    }

    // 2. Buscar todas las planificaciones generales del día del coach
    const coachPlanifications = await prisma.planification.findMany({
      where: {
        coachId,
        isPersonalized: false,
        date: { gte: normalizedDate, lt: endOfDay },
      },
      include: planificationInclude,
      orderBy: { date: 'asc' },
    })

    // 3. Combinar resultados: primero personalizadas, luego generales por disciplina
    const result: any[] = []
    const seenDisciplineIds = new Set<number>()

    // Agregar primero las personalizadas
    for (const p of personalizedPlanifications) {
      result.push(transformPlanificationResponse(p))
      if (p.disciplineId != null) {
        seenDisciplineIds.add(p.disciplineId)
      }
    }

    // Luego agregar las generales que correspondan a disciplinas del usuario
    // y que no hayan sido ya cubiertas por una personalizada
    for (const ud of userDisciplines) {
      if (seenDisciplineIds.has(ud.disciplineId)) continue

      const plan = coachPlanifications.find(
        (p) => p.disciplineId === ud.disciplineId
      ) ?? null

      if (plan && plan.disciplineId != null) {
        seenDisciplineIds.add(plan.disciplineId)
        result.push(transformPlanificationResponse(plan))
      }
    }

    const response = NextResponse.json({ data: result })
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    return response
  } catch (error) {
    console.error('Error fetching today-all planifications:', error)
    return NextResponse.json(
      { error: 'Error al cargar las planificaciones' },
      { status: 500 }
    )
  }
}
