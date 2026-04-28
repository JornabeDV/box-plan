import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function transformItem(item: any) {
  return {
    id: String(item.id),
    description: item.description,
    order: item.order,
    exercise: item.exercise
      ? { id: String(item.exercise.id), name: item.exercise.name, video_url: item.exercise.videoUrl }
      : null,
  }
}

function transformSubBlock(sub: any) {
  return {
    id: String(sub.id),
    subtitle: sub.subtitle,
    order: sub.order,
    timer_mode: sub.timerMode || null,
    timer_config: sub.timerConfig || undefined,
    items: sub.items?.map(transformItem) || [],
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

// GET /api/planifications/today?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const relationship = await prisma.coachStudentRelationship.findFirst({
      where: { studentId: userId, status: 'active' },
      include: { coach: { select: { id: true } } },
    })

    if (!relationship) {
      return NextResponse.json({
        data: [],
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
            select: { preferredDisciplineId: true, preferredLevelId: true },
          })
        : null

    if (userDisciplines.length === 0 && !preference?.preferredDisciplineId) {
      return NextResponse.json({
        data: [],
        needsPreference: true,
        message: 'El usuario no tiene disciplinas asignadas',
      })
    }

    const { searchParams } = new URL(request.url)
    const disciplineIdParam = searchParams.get('disciplineId')
    const levelIdParam = searchParams.get('levelId')

    let selectedDisciplineId: number | null = null
    let selectedLevelId: number | null = null

    if (disciplineIdParam) {
      selectedDisciplineId = parseInt(disciplineIdParam, 10)
      if (isNaN(selectedDisciplineId)) selectedDisciplineId = null
    }

    if (levelIdParam) {
      selectedLevelId = parseInt(levelIdParam, 10)
      if (isNaN(selectedLevelId)) selectedLevelId = null
    }

    let disciplineLevelCombinations: {
      disciplineId: number
      levelId: number | null
    }[] = []

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
    } else if (preference) {
      disciplineLevelCombinations = [
        {
          disciplineId: preference.preferredDisciplineId!,
          levelId: preference.preferredLevelId,
        },
      ]
    }

    const validCombinations = disciplineLevelCombinations.filter(
      (c) => c.levelId !== null
    )

    if (validCombinations.length === 0) {
      return NextResponse.json({
        data: [],
        needsLevel: true,
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

    const planifications = await prisma.planification.findMany({
      where: {
        coachId: coachId,
        date: { gte: normalizedDate, lt: endOfDay },
        OR: validCombinations.map((combo) => ({
          disciplineId: combo.disciplineId,
          disciplineLevelId: combo.levelId,
        })),
      },
      include: {
        discipline: { select: { id: true, name: true, color: true } },
        disciplineLevel: { select: { id: true, name: true, description: true } },
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            items: { orderBy: { order: 'asc' }, include: { exercise: true } },
            subBlocks: {
              orderBy: { order: 'asc' },
              include: {
                items: { orderBy: { order: 'asc' }, include: { exercise: true } },
              },
            },
          },
        },
      },
      orderBy: [
        { discipline: { orderIndex: 'asc' } },
        { disciplineLevel: { orderIndex: 'asc' } },
      ],
    })

    if (planifications.length === 0) {
      return NextResponse.json({
        data: [],
        message: `No hay planificaciones para ${dateParam ? 'esa fecha' : 'hoy'} con tus disciplinas y niveles`,
      })
    }

    const transformed = planifications.map((planification: any) => ({
      ...planification,
      blocks: planification.blocks?.map(transformBlock) || [],
      discipline: planification.discipline
        ? { id: planification.discipline.id, name: planification.discipline.name, color: planification.discipline.color }
        : null,
      discipline_level: planification.disciplineLevel
        ? { id: planification.disciplineLevel.id, name: planification.disciplineLevel.name, description: planification.disciplineLevel.description }
        : null,
    }))

    return NextResponse.json({ data: transformed })
  } catch (error) {
    console.error('Error fetching today planification:', error)
    return NextResponse.json(
      { error: 'Error al cargar la planificación de hoy' },
      { status: 500 }
    )
  }
}
