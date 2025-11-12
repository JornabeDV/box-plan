import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasCoachAccess, getTrialDaysRemaining } from '@/lib/coach-helpers'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		
		const userId = normalizeUserId(session?.user?.id)
		if (!userId) {
			return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
		}

		// Verificar que el usuario es coach
		const authCheck = await isCoach(userId)
		if (!authCheck.isAuthorized || !authCheck.profile) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
		}

		const coachId = authCheck.profile.id
		const access = await hasCoachAccess(coachId)
		
		const daysRemaining = access.isTrial && access.trialEndsAt 
			? getTrialDaysRemaining(access.trialEndsAt)
			: 0

		const response = NextResponse.json({
			hasAccess: access.hasAccess,
			isTrial: access.isTrial,
			trialEndsAt: access.trialEndsAt?.toISOString() || null,
			daysRemaining,
			subscription: access.subscription
		})
		
		// Agregar caché para reducir queries repetidas
		response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30')
		
		return response
	} catch (error) {
		console.error('Error checking coach access:', error)
		return NextResponse.json(
			{ error: 'Error al verificar acceso' },
			{ status: 500 }
		)
	}
}