import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasCoachAccess, getTrialDaysRemaining } from '@/lib/coach-helpers'
import { isCoach } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
		}

		// Verificar que el usuario es coach
		const authCheck = await isCoach(session.user.id)
		if (!authCheck.isAuthorized || !authCheck.profile) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
		}

		const coachId = authCheck.profile.id
		const access = await hasCoachAccess(coachId)
		
		const daysRemaining = access.isTrial && access.trialEndsAt 
			? getTrialDaysRemaining(access.trialEndsAt)
			: 0

		return NextResponse.json({
			hasAccess: access.hasAccess,
			isTrial: access.isTrial,
			trialEndsAt: access.trialEndsAt?.toISOString() || null,
			daysRemaining,
			subscription: access.subscription
		})
	} catch (error) {
		console.error('Error checking coach access:', error)
		return NextResponse.json(
			{ error: 'Error al verificar acceso' },
			{ status: 500 }
		)
	}
}