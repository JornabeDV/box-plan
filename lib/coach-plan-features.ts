/**
 * Tipos y helpers para manejar las funcionalidades según el plan del coach
 */

import { prisma } from './prisma'

/**
 * Tipos de características disponibles en los planes de coaches
 */
export interface CoachPlanFeatures {
	dashboard_custom?: boolean
	daily_planification?: boolean
	planification_weeks?: number // Para START: 1 semana
	planification_monthly?: boolean // Para POWER: cargas mensuales
	planification_unlimited?: boolean // Para ELITE: sin límite
	max_disciplines?: number // 2 para START, 3 para POWER, 999999 para ELITE
	timer?: boolean
	score_loading?: boolean // Para POWER y ELITE
	score_database?: boolean // Para POWER y ELITE
	mercadopago_connection?: boolean // Para POWER
	virtual_wallet?: boolean // Para ELITE
	whatsapp_integration?: boolean // Para POWER y ELITE
	community_forum?: boolean // Para POWER y ELITE
}

/**
 * Resultado de obtener el plan activo del coach
 */
export interface CoachPlanInfo {
	planId: number
	planName: string
	displayName: string
	features: CoachPlanFeatures
	maxStudents: number
	commissionRate: number
	isActive: boolean
	isTrial: boolean
}

/**
 * Obtiene el plan activo del coach con sus características
 */
export async function getCoachActivePlan(coachId: number): Promise<CoachPlanInfo | null> {
	const coachProfile = await prisma.coachProfile.findUnique({
		where: { id: coachId },
		include: {
			subscriptions: {
				where: {
					status: 'active'
				},
				orderBy: {
					currentPeriodEnd: 'desc'
				},
				take: 1,
				include: {
					plan: true
				}
			}
		}
	})

	if (!coachProfile) {
		return null
	}

	// Si tiene suscripción activa, usar ese plan
	if (coachProfile.subscriptions.length > 0) {
		const subscription = coachProfile.subscriptions[0]
		const plan = subscription.plan
		const now = new Date()

		if (subscription.currentPeriodEnd > now) {
			const features = plan.features as CoachPlanFeatures || {}
			
			return {
				planId: plan.id,
				planName: plan.name,
				displayName: plan.displayName,
				features,
				maxStudents: plan.maxStudents,
				commissionRate: Number(plan.commissionRate),
				isActive: true,
				isTrial: false
			}
		}
	}

	// Si está en período de prueba, usar plan START por defecto
	if (coachProfile.trialEndsAt) {
		const now = new Date()
		const trialEndsAt = coachProfile.trialEndsAt instanceof Date
			? coachProfile.trialEndsAt
			: new Date(coachProfile.trialEndsAt)
		
		const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const trialDate = new Date(trialEndsAt.getFullYear(), trialEndsAt.getMonth(), trialEndsAt.getDate())

		if (trialDate >= nowDate) {
			// Obtener plan START como plan por defecto del trial
			const startPlan = await prisma.coachPlanType.findUnique({
				where: { name: 'start' }
			})

			if (startPlan) {
				const features = startPlan.features as CoachPlanFeatures || {}
				
				return {
					planId: startPlan.id,
					planName: startPlan.name,
					displayName: startPlan.displayName,
					features,
					maxStudents: startPlan.maxStudents,
					commissionRate: Number(startPlan.commissionRate),
					isActive: true,
					isTrial: true
				}
			}
		}
	}

	return null
}

/**
 * Obtiene el plan del coach de un estudiante
 */
export async function getStudentCoachPlan(studentId: number): Promise<CoachPlanInfo | null> {
	const relationship = await prisma.coachStudentRelationship.findFirst({
		where: {
			studentId,
			status: 'active'
		},
		include: {
			coach: true
		}
	})

	if (!relationship) {
		return null
	}

	return getCoachActivePlan(relationship.coachId)
}

/**
 * Verifica si el coach tiene acceso a una funcionalidad específica
 */
export async function coachHasFeature(
	coachId: number,
	feature: keyof CoachPlanFeatures
): Promise<boolean> {
	const planInfo = await getCoachActivePlan(coachId)
	
	if (!planInfo) {
		return false
	}

	return planInfo.features[feature] === true
}

/**
 * Verifica si un estudiante tiene acceso a una funcionalidad a través de su coach
 */
export async function studentHasFeature(
	studentId: number,
	feature: keyof CoachPlanFeatures
): Promise<boolean> {
	const planInfo = await getStudentCoachPlan(studentId)
	
	if (!planInfo) {
		return false
	}

	return planInfo.features[feature] === true
}

/**
 * Obtiene el límite de disciplinas del plan del coach
 */
export async function getCoachMaxDisciplines(coachId: number): Promise<number> {
	const planInfo = await getCoachActivePlan(coachId)
	
	if (!planInfo) {
		return 0
	}

	return planInfo.features.max_disciplines || 0
}

/**
 * Verifica si el coach puede cargar planificaciones mensuales
 */
export async function canCoachLoadMonthlyPlanifications(coachId: number): Promise<boolean> {
	const planInfo = await getCoachActivePlan(coachId)
	
	if (!planInfo) {
		return false
	}

	return planInfo.features.planification_monthly === true || 
	       planInfo.features.planification_unlimited === true
}

/**
 * Verifica si el coach puede cargar planificaciones sin límite
 */
export async function canCoachLoadUnlimitedPlanifications(coachId: number): Promise<boolean> {
	const planInfo = await getCoachActivePlan(coachId)
	
	if (!planInfo) {
		return false
	}

	return planInfo.features.planification_unlimited === true
}

/**
 * Obtiene el número de semanas permitidas para cargar planificaciones (solo para START)
 */
export async function getCoachPlanificationWeeks(coachId: number): Promise<number> {
	const planInfo = await getCoachActivePlan(coachId)
	
	if (!planInfo) {
		return 0
	}

	return planInfo.features.planification_weeks || 0
}

/**
 * Verifica si el coach puede usar MercadoPago
 */
export async function canCoachUseMercadoPago(coachId: number): Promise<boolean> {
	return coachHasFeature(coachId, 'mercadopago_connection')
}

/**
 * Verifica si el coach puede usar billetera virtual
 */
export async function canCoachUseVirtualWallet(coachId: number): Promise<boolean> {
	return coachHasFeature(coachId, 'virtual_wallet')
}

/**
 * Verifica si el coach puede usar WhatsApp
 */
export async function canCoachUseWhatsApp(coachId: number): Promise<boolean> {
	return coachHasFeature(coachId, 'whatsapp_integration')
}

/**
 * Verifica si el coach puede usar el foro de comunidad
 */
export async function canCoachUseCommunityForum(coachId: number): Promise<boolean> {
	return coachHasFeature(coachId, 'community_forum')
}

/**
 * Verifica si el coach puede cargar scores de estudiantes
 */
export async function canCoachLoadScores(coachId: number): Promise<boolean> {
	return coachHasFeature(coachId, 'score_loading')
}

/**
 * Verifica si el coach tiene acceso a la base de datos de scores
 */
export async function canCoachAccessScoreDatabase(coachId: number): Promise<boolean> {
	return coachHasFeature(coachId, 'score_database')
}
