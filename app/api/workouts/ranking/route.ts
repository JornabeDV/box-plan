import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

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

		// Obtener todos los workouts del día especificado que sean WODs (tienen duration_seconds)
		// Usar solo las columnas que existen: user_id, completed_at, duration_seconds
		const workouts = await sql`
			SELECT 
				w.id,
				w.user_id,
				w.completed_at,
				w.duration_seconds,
				COALESCE(u.name, u.email) as user_name,
				u.email as user_email
			FROM workouts w
			LEFT JOIN users u ON w.user_id = u.id
			WHERE w.completed_at IS NOT NULL
				AND DATE(w.completed_at) = ${targetDate}::date
				AND w.duration_seconds IS NOT NULL
				AND w.duration_seconds > 0
			ORDER BY w.duration_seconds ASC, w.completed_at ASC
		`

		// Agrupar todos los workouts en un solo grupo "WOD del día"
		// Ya que no tenemos información del nombre del WOD en la base de datos
		const groupedByWOD: Record<string, any[]> = {
			'WOD del día': []
		}
		
		workouts.forEach((workout: any) => {
			groupedByWOD['WOD del día'].push({
				id: workout.id,
				user_id: workout.user_id,
				user_name: workout.user_name || 'Usuario',
				duration_seconds: workout.duration_seconds,
				completed_at: workout.completed_at,
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