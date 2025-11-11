import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workouts/ranking?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		const { searchParams } = new URL(request.url)
		const dateParam = searchParams.get('date')

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Si no hay fecha, usar el día anterior
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

		// Obtener todos los workouts del día especificado que sean WODs
		const targetDateObj = new Date(targetDate)
		targetDateObj.setHours(0, 0, 0, 0)
		const nextDay = new Date(targetDateObj)
		nextDay.setDate(nextDay.getDate() + 1)

		const workouts = await prisma.workout.findMany({
			where: {
				completedAt: {
					not: null,
					gte: targetDateObj,
					lt: nextDay
				},
				durationSeconds: {
					not: null,
					gt: 0
				}
			},
			include: {
				user: {
					select: {
						name: true,
						email: true
					}
				}
			},
			orderBy: [
				{ durationSeconds: 'asc' },
				{ completedAt: 'asc' }
			]
		})

		// Agrupar todos los workouts en un solo grupo "WOD del día"
		// Ya que no tenemos información del nombre del WOD en la base de datos
		const groupedByWOD: Record<string, any[]> = {
			'WOD del día': []
		}
		
		workouts.forEach((workout) => {
			groupedByWOD['WOD del día'].push({
				id: workout.id,
				user_id: workout.userId,
				user_name: workout.user.name || workout.user.email || 'Usuario',
				duration_seconds: workout.durationSeconds,
				completed_at: workout.completedAt,
				notes: null
			})
		})

		// Convertir a array y ordenar por cantidad de participantes
		const rankings = Object.entries(groupedByWOD).map(([wodName, participants]) => ({
			wod_name: wodName,
			participants: participants.map((p, index) => ({
				...p,
				rank: index + 1
			})),
			total_participants: participants.length
		})).sort((a, b) => b.total_participants - a.total_participants)

		return NextResponse.json({
			date: targetDate,
			rankings
		})
	} catch (error) {
		console.error('Error fetching ranking:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}