import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'
import { studentHasFeature } from '@/lib/coach-plan-features'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/workouts/ranking?days=7
// Devuelve rankings de los últimos N días (por defecto 7)
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)
		
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Verificar si el usuario tiene acceso a la base de datos de scores según el plan del coach
		try {
			const hasAccess = await studentHasFeature(userId, 'score_database')
			if (!hasAccess) {
				return NextResponse.json(
					{ error: 'Tu plan no incluye la funcionalidad de Ranking. Actualiza tu plan para acceder a esta funcionalidad.' },
					{ status: 403 }
				)
			}
		} catch (planError) {
			// Si hay error al obtener el plan, loguear pero continuar con la consulta
			console.error('Error al validar acceso a ranking:', planError)
		}

		const { searchParams } = new URL(request.url)
		const dateParam = searchParams.get('date')

		// Si hay fecha específica, usar esa fecha. Si no, usar el día anterior
		let targetDate: string
		if (dateParam) {
			targetDate = dateParam
		} else {
			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)
			const year = yesterday.getFullYear()
			const month = String(yesterday.getMonth() + 1).padStart(2, '0')
			const day = String(yesterday.getDate()).padStart(2, '0')
			targetDate = `${year}-${month}-${day}`
		}

		// Obtener el coach del usuario
		const relationship = await prisma.coachStudentRelationship.findFirst({
			where: {
				studentId: userId,
				status: 'active'
			},
			include: {
				coach: {
					select: {
						id: true
					}
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

		// Obtener la disciplina preferida del usuario
		const preference = await prisma.userPreference.findUnique({
			where: { userId },
			select: {
				preferredDisciplineId: true
			}
		})

		if (!preference || !preference.preferredDisciplineId) {
			return NextResponse.json({
				rankings: [],
				message: 'El usuario no tiene disciplina preferida configurada'
			})
		}

		const disciplineId = preference.preferredDisciplineId

		// Obtener planificaciones del coach y disciplina para la fecha especificada
		const startOfDay = normalizeDateForArgentina(targetDate)
		const [year, month, day] = targetDate.split('-').map(Number)
		const nextDayStr = new Date(year, month - 1, day + 1).toISOString().split('T')[0]
		const endOfDay = normalizeDateForArgentina(nextDayStr)

		const planifications = await prisma.planification.findMany({
			where: {
				coachId,
				disciplineId,
				date: {
					gte: startOfDay,
					lt: endOfDay
				}
			},
			select: {
				id: true
			}
		})

		const planificationIds = planifications.map(p => p.id)

		if (planificationIds.length === 0) {
			return NextResponse.json({
				date: targetDate,
				rankings: []
			})
		}

		// Obtener todos los workouts del día especificado asociados a las planificaciones
		const allWorkouts = await prisma.workout.findMany({
			where: {
				planificationId: {
					in: planificationIds
				},
				completedAt: {
					not: null,
					gte: startOfDay,
					lt: endOfDay
				}
			},
			include: {
				user: {
					select: {
						name: true,
						email: true
					}
				}
			}
		})

		// Filtrar y procesar workouts del día
		const workouts = allWorkouts

		// Filtrar workouts de tiempo (WOD)
		const wodWorkouts = workouts
			.filter(workout => {
				if (!workout.data) return false
				const data = workout.data as any
				return data.type === 'wod_score' && workout.durationSeconds && workout.durationSeconds > 0
			})
			.sort((a, b) => {
				// Ordenar por tiempo ascendente (menor tiempo = mejor)
				if (a.durationSeconds && b.durationSeconds) {
					if (a.durationSeconds !== b.durationSeconds) {
						return a.durationSeconds - b.durationSeconds
					}
				}
				// Si hay empate, ordenar por fecha (más temprano = mejor)
				if (a.completedAt && b.completedAt) {
					return a.completedAt.getTime() - b.completedAt.getTime()
				}
				return 0
			})

		// Filtrar workouts de fuerza
		const strengthWorkouts = workouts
			.filter(workout => {
				if (!workout.data) return false
				const data = workout.data as any
				return data.type === 'strength_score' && data.weight && data.weight > 0
			})
			.sort((a, b) => {
				// Ordenar por peso descendente (mayor peso = mejor)
				const aWeight = (a.data as any)?.weight || 0
				const bWeight = (b.data as any)?.weight || 0
				if (bWeight !== aWeight) {
					return bWeight - aWeight
				}
				// Si hay empate, ordenar por fecha (más temprano = mejor)
				if (a.completedAt && b.completedAt) {
					return a.completedAt.getTime() - b.completedAt.getTime()
				}
				return 0
			})

		// Procesar rankings de tiempo (WOD)
		const wodRankings = wodWorkouts.map((workout, index) => ({
			id: String(workout.id),
			user_id: workout.userId,
			user_name: workout.user.name || workout.user.email || 'Usuario',
			duration_seconds: workout.durationSeconds,
			completed_at: workout.completedAt,
			weight: null,
			notes: null,
			rank: index + 1
		}))

		// Procesar rankings de fuerza (ordenar por peso descendente)
		const strengthRankings = strengthWorkouts.map((workout, index) => ({
			id: String(workout.id),
			user_id: workout.userId,
			user_name: workout.user.name || workout.user.email || 'Usuario',
			duration_seconds: null,
			completed_at: workout.completedAt,
			weight: (workout.data as any)?.weight || 0,
			notes: null,
			rank: index + 1
		}))

		// Construir respuesta con ambos rankings
		const rankings: any[] = []

		if (wodRankings.length > 0) {
			rankings.push({
				wod_name: 'WOD del día',
				type: 'time',
				participants: wodRankings,
				total_participants: wodRankings.length
			})
		}

		if (strengthRankings.length > 0) {
			rankings.push({
				wod_name: 'Fuerza del día',
				type: 'strength',
				participants: strengthRankings,
				total_participants: strengthRankings.length
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
