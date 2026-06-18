import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import {
	getCachedUserRole,
	getCachedProfile,
	getCachedCurrentSubscription,
	getCachedUserCoach,
	getCachedUserDisciplines,
	getCachedUserPreferences
} from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/home
// Devuelve todos los datos necesarios para la Home del estudiante en una sola llamada
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		if (!userId) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		// Cargar todos los datos en paralelo
		const [roleData, profile, currentSubscription, coachData, disciplines, preferences] = await Promise.all([
			getCachedUserRole(userId),
			getCachedProfile(userId),
			getCachedCurrentSubscription(userId),
			getCachedUserCoach(userId),
			getCachedUserDisciplines(userId),
			getCachedUserPreferences(userId)
		])

		const response = NextResponse.json({
			role: roleData.role,
			adminProfile: roleData.adminProfile,
			coachProfile: roleData.coachProfile,
			profile,
			subscription: currentSubscription.data,
			coach: coachData.coach,
			disciplines,
			preferences
		})

		response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
		return response
	} catch (error) {
		console.error('Error fetching home data:', error)
		return NextResponse.json(
			{ error: 'Error al cargar los datos de la Home' },
			{ status: 500 }
		)
	}
}
