import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { requireProgressTracking } from '@/lib/api-feature-guards'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_METRICS = ['time', 'weight', 'reps', 'rounds_reps'] as const

type Metric = typeof VALID_METRICS[number]

function isValidMetric(metric: string): metric is Metric {
  return VALID_METRICS.includes(metric as Metric)
}

// GET /api/workouts/block-results?planificationId=X
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const planificationIdParam = searchParams.get('planificationId')

    if (!planificationIdParam) {
      return NextResponse.json({ error: 'planificationId requerido' }, { status: 400 })
    }

    const planificationId = parseInt(planificationIdParam, 10)
    if (isNaN(planificationId)) {
      return NextResponse.json({ error: 'planificationId inválido' }, { status: 400 })
    }

    const workout = await prisma.workout.findFirst({
      where: { userId, planificationId },
      include: {
        blockResults: {
          include: {
            planificationBlock: {
              select: { id: true, title: true, scoreConfig: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ results: workout?.blockResults || [] })
  } catch (error) {
    console.error('Error fetching block results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workouts/block-results
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guard = await requireProgressTracking(userId)
    if (!guard.allowed && guard.response) {
      return guard.response
    }

    const body = await request.json()
    const { planification_block_id, metric, value } = body

    if (!planification_block_id || !metric || value === undefined || value === null) {
      return NextResponse.json(
        { error: 'planification_block_id, metric y value son requeridos' },
        { status: 400 }
      )
    }

    if (!isValidMetric(metric)) {
      return NextResponse.json(
        { error: `Métrica inválida. Valores permitidos: ${VALID_METRICS.join(', ')}` },
        { status: 400 }
      )
    }

    const planificationBlockId = typeof planification_block_id === 'string'
      ? parseInt(planification_block_id, 10)
      : planification_block_id

    if (isNaN(planificationBlockId)) {
      return NextResponse.json({ error: 'planification_block_id inválido' }, { status: 400 })
    }

    // Validar que el bloque pertenezca a una planificación del coach del usuario
    const planificationBlock = await prisma.planificationBlock.findUnique({
      where: { id: planificationBlockId },
      select: {
        id: true,
        planificationId: true,
        planification: { select: { coachId: true } }
      },
    })

    if (!planificationBlock) {
      return NextResponse.json({ error: 'Bloque no encontrado' }, { status: 404 })
    }

    const relationship = await prisma.coachStudentRelationship.findFirst({
      where: {
        coachId: planificationBlock.planification.coachId,
        studentId: userId,
        status: 'active',
      },
    })

    if (!relationship) {
      return NextResponse.json(
        { error: 'No estás asociado al coach de esta planificación' },
        { status: 403 }
      )
    }

    const planificationId = planificationBlock.planificationId
    const completedAt = new Date()

    // Buscar o crear el workout padre
    const existingWorkout = await prisma.workout.findFirst({
      where: { userId, planificationId },
    })

    let workoutId: number
    if (existingWorkout) {
      workoutId = existingWorkout.id
      await prisma.workout.update({
        where: { id: workoutId },
        data: { completedAt },
      })
    } else {
      const newWorkout = await prisma.workout.create({
        data: {
          userId,
          planificationId,
          completedAt,
          data: {},
        },
      })
      workoutId = newWorkout.id
    }

    // Buscar resultado existente para este bloque
    const existingResult = await prisma.workoutBlockResult.findFirst({
      where: { workoutId, planificationBlockId },
    })

    let result
    if (existingResult) {
      result = await prisma.workoutBlockResult.update({
        where: { id: existingResult.id },
        data: {
          metric,
          value,
          completedAt,
        },
      })
    } else {
      result = await prisma.workoutBlockResult.create({
        data: {
          workoutId,
          planificationBlockId,
          metric,
          value,
          completedAt,
        },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error saving block result:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
