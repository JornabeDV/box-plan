import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'
import { getCoachActivePlan, getStudentCoachPlan } from '@/lib/coach-plan-features'

/**
 * GET /api/coaches/plan-features
 * Obtiene las funcionalidades del plan del coach (o del coach del estudiante)
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		console.log('[API plan-features] userId de sesión:', userId)

		if (!userId) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		// Verificar si el usuario es coach
		const authCheck = await isCoach(userId)
		console.log('[API plan-features] authCheck:', { 
			isAuthorized: authCheck.isAuthorized, 
			profileId: authCheck.profile?.id 
		})
		
		let planInfo = null

		if (authCheck.isAuthorized && authCheck.profile) {
			// Es coach, obtener su plan
			console.log('[API plan-features] Obteniendo plan para coachId:', authCheck.profile.id)
			planInfo = await getCoachActivePlan(authCheck.profile.id)
			console.log('[API plan-features] Plan obtenido:', planInfo ? planInfo.planName : 'null')
		} else {
			// Es estudiante, obtener el plan de su coach
			console.log('[API plan-features] Obteniendo plan para estudiante:', userId)
			planInfo = await getStudentCoachPlan(userId)
		}

		// Si no hay plan, devolver null en lugar de error 404
		// Esto permite que usuarios sin coach no generen errores
		return NextResponse.json({
			planInfo: planInfo ? {
				planId: planInfo.planId,
				planName: planInfo.planName,
				displayName: planInfo.displayName,
				slug: planInfo.slug,
				features: planInfo.features,
				maxStudents: planInfo.maxStudents,
				commissionRate: planInfo.commissionRate,
				maxStudentPlans: planInfo.maxStudentPlans,
				maxStudentPlanTier: planInfo.maxStudentPlanTier,
				isActive: planInfo.isActive,
				isTrial: planInfo.isTrial
			} : null
		})
	} catch (error) {
		console.error('Error getting coach plan features:', error)
		return NextResponse.json(
			{ error: 'Error al obtener funcionalidades del plan' },
			{ status: 500 }
		)
	}
}
