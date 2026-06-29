import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'
import { requireRankingAccess } from '@/lib/api-feature-guards'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Metric = 'time' | 'weight' | 'reps' | 'rounds_reps'

function getSortableValue(metric: Metric, value: any): number {
  if (!value) return 0
  switch (metric) {
    case 'time':
      return typeof value.seconds === 'number' ? value.seconds : 0
    case 'weight':
      return typeof value.weight === 'number' ? value.weight : 0
    case 'reps':
      return typeof value.reps === 'number' ? value.reps : 0
    case 'rounds_reps':
      const rounds = typeof value.rounds === 'number' ? value.rounds : 0
      const reps = typeof value.reps === 'number' ? value.reps : 0
      return rounds * 1000 + reps
    default:
      return 0
  }
}

function formatValue(metric: Metric, value: any): string {
  if (!value) return '-'
  switch (metric) {
    case 'time': {
      const seconds = value.seconds || 0
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${String(secs).padStart(2, '0')}`
    }
    case 'weight':
      return `${value.weight || 0} ${value.unit || 'kg'}`
    case 'reps':
      return `${value.reps || 0} reps`
    case 'rounds_reps':
      return `${value.rounds || 0} rounds + ${value.reps || 0} reps`
    default:
      return '-'
  }
}

// GET /api/workouts/ranking?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guard = await requireRankingAccess(userId)
    if (!guard.allowed && guard.response) {
      return guard.response
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    let targetDate: string
    if (dateParam) {
      targetDate = dateParam
    } else {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      targetDate = `${year}-${month}-${day}`
    }

    const relationship = await prisma.coachStudentRelationship.findFirst({
      where: {
        studentId: userId,
        status: 'active'
      },
      include: {
        coach: {
          select: { id: true }
        }
      }
    })

    if (!relationship) {
      return NextResponse.json({
        rankings: [],
        message: 'El usuario no está asociado a ningún coach activo'
      })
    }

    const coachId = relationship.coach.id

    const preference = await prisma.userPreference.findUnique({
      where: { userId },
      select: { preferredDisciplineId: true }
    })

    if (!preference || !preference.preferredDisciplineId) {
      return NextResponse.json({
        rankings: [],
        message: 'El usuario no tiene disciplina preferida configurada'
      })
    }

    const disciplineId = preference.preferredDisciplineId

    const startOfDay = normalizeDateForArgentina(targetDate)
    const [year, month, day] = targetDate.split('-').map(Number)
    const nextDayStr = new Date(year, month - 1, day + 1).toISOString().split('T')[0]
    const endOfDay = normalizeDateForArgentina(nextDayStr)

    const planifications = await prisma.planification.findMany({
      where: {
        coachId,
        disciplineId,
        date: { gte: startOfDay, lt: endOfDay }
      },
      include: {
        blocks: {
          include: {
            items: {
              include: { exercise: { select: { id: true, name: true } } }
            },
            subBlocks: {
              include: {
                items: {
                  include: { exercise: { select: { id: true, name: true } } }
                }
              }
            }
          }
        }
      }
    })

    // Recolectar bloques rankeables
    const rankableBlocks: Array<{
      id: number
      title: string
      metric: Metric
      label?: string
      planificationId: number
    }> = []

    for (const planification of planifications) {
      for (const block of planification.blocks) {
        const config = block.scoreConfig as any
        if (config?.metric && config?.includeInRanking) {
          rankableBlocks.push({
            id: block.id,
            title: block.title,
            metric: config.metric as Metric,
            label: config.label,
            planificationId: planification.id,
          })
        }
      }
    }

    if (rankableBlocks.length === 0) {
      return NextResponse.json({
        date: targetDate,
        rankings: []
      })
    }

    const blockIds = rankableBlocks.map(b => b.id)

    // Obtener todos los resultados de los alumnos del coach para estos bloques
    const results = await prisma.workoutBlockResult.findMany({
      where: {
        planificationBlockId: { in: blockIds },
        workout: {
          user: {
            studentRelationships: {
              some: {
                coachId,
                status: 'active'
              }
            }
          }
        }
      },
      include: {
        workout: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    // Agrupar por bloque y ordenar
    const rankings = []

    for (const block of rankableBlocks) {
      const blockResults = results.filter(r => r.planificationBlockId === block.id)

      if (blockResults.length === 0) continue

      const isLowerBetter = block.metric === 'time'

      const sorted = blockResults
        .map(r => ({
          id: String(r.id),
          user_id: r.workout.userId,
          user_name: r.workout.user.name || r.workout.user.email || 'Usuario',
          metric: block.metric,
          value: r.value,
          display_value: formatValue(block.metric, r.value),
          sort_value: getSortableValue(block.metric, r.value),
          completed_at: r.completedAt,
        }))
        .sort((a, b) => {
          if (isLowerBetter) {
            return a.sort_value - b.sort_value
          }
          return b.sort_value - a.sort_value
        })
        .map((r, index) => ({ ...r, rank: index + 1 }))

      const title = block.label || block.title

      rankings.push({
        block_id: String(block.id),
        wod_name: title,
        type: block.metric,
        participants: sorted,
        total_participants: sorted.length
      })
    }

    return NextResponse.json({
      date: targetDate,
      rankings
    })
  } catch (error) {
    console.error('Error fetching ranking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
