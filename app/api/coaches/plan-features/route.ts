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

		if (!userId) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		// Verificar si el usuario es coach
		const authCheck = await isCoach(userId)
		let planInfo = null

		if (authCheck.isAuthorized && authCheck.profile) {
			// Es coach, obtener su plan
			planInfo = await getCoachActivePlan(authCheck.profile.id)
		} else {
			// Es estudiante, obtener el plan de su coach
			planInfo = await getStudentCoachPlan(userId)
		}

		if (!planInfo) {
			return NextResponse.json(
				{ error: 'No se encontró plan activo' },
				{ status: 404 }
			)
		}

		return NextResponse.json({
			planInfo: {
				planId: planInfo.planId,
				planName: planInfo.planName,
				displayName: planInfo.displayName,
				features: planInfo.features,
				maxStudents: planInfo.maxStudents,
				commissionRate: planInfo.commissionRate,
				isActive: planInfo.isActive,
				isTrial: planInfo.isTrial
			}
		})
	} catch (error) {
		console.error('Error getting coach plan features:', error)
		return NextResponse.json(
			{ error: 'Error al obtener funcionalidades del plan' },
			{ status: 500 }
		)
	}
}
