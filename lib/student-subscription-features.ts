/**
 * Tipos y helpers para manejar las funcionalidades de los planes de suscripción de estudiantes
 * Estas son las features que el estudiante tiene activas según el plan que contrató
 */

import { prisma } from './prisma'

/**
 * Features disponibles en los planes de suscripción de estudiantes
 * Estas son configuradas por el coach al crear el plan
 * 
 * MAPEO desde features del CoachPlanType:
 * - coach.whatsapp_integration → student.whatsappSupport
 * - coach.community_forum → student.communityAccess
 * - coach.score_loading → student.progressTracking
 * - coach.score_database → student.leaderboardAccess
 * - coach.timer → student.timerAccess
 * - coach.personalized_planifications → student.personalizedWorkouts
 */
export interface StudentSubscriptionFeatures {
	/** Soporte por WhatsApp - requiere coach.whatsapp_integration */
	whatsappSupport?: boolean
	/** Acceso a la comunidad/foro - requiere coach.community_forum */
	communityAccess?: boolean
	/** Seguimiento de progreso (carga de scores) - requiere coach.score_loading */
	progressTracking?: boolean
	/** Acceso al ranking/leaderboard - requiere coach.score_database */
	leaderboardAccess?: boolean
	/** Acceso al cronómetro durante workouts - requiere coach.timer */
	timerAccess?: boolean
	/** Planificaciones personalizadas - requiere coach.personalized_planifications */
	personalizedWorkouts?: boolean
}

/**
 * Información completa de la suscripción del estudiante
 */
export interface StudentSubscriptionInfo {
	subscriptionId: number
	planId: number
	planName: string
	status: string
	features: StudentSubscriptionFeatures
	planificationAccess: string
	currentPeriodStart: Date
	currentPeriodEnd: Date
}

/**
 * Obtiene la suscripción activa del estudiante con sus features
 */
export async function getStudentSubscription(
	studentId: number
): Promise<StudentSubscriptionInfo | null> {
	const subscription = await prisma.subscription.findFirst({
		where: {
			userId: studentId,
			status: 'active'
		},
		include: {
			plan: true
		},
		orderBy: { createdAt: 'desc' }
	})

	if (!subscription) {
		return null
	}

	const features = subscription.plan.features as StudentSubscriptionFeatures || {}

	return {
		subscriptionId: subscription.id,
		planId: subscription.planId,
		planName: subscription.plan.name,
		status: subscription.status,
		features,
		planificationAccess: subscription.plan.planificationAccess,
		currentPeriodStart: subscription.currentPeriodStart,
		currentPeriodEnd: subscription.currentPeriodEnd
	}
}

/**
 * Verifica si el estudiante tiene una feature específica
 */
export async function studentHasFeature(
	studentId: number,
	feature: keyof StudentSubscriptionFeatures
): Promise<boolean> {
	const subscription = await getStudentSubscription(studentId)
	
	if (!subscription) {
		return false
	}

	return subscription.features[feature] === true
}

/**
 * Verifica si el estudiante tiene acceso al cronómetro
 */
export async function canStudentUseTimer(studentId: number): Promise<boolean> {
	// El cronómetro está disponible para todos los estudiantes con suscripción activa
	const subscription = await getStudentSubscription(studentId)
	return subscription !== null
}

/**
 * Verifica si el estudiante puede ver el ranking
 */
export async function canStudentViewRanking(studentId: number): Promise<boolean> {
	return studentHasFeature(studentId, 'leaderboardAccess')
}

/**
 * Verifica si el estudiante puede cargar su progreso/scores
 */
export async function canStudentTrackProgress(studentId: number): Promise<boolean> {
	return studentHasFeature(studentId, 'progressTracking')
}

/**
 * Verifica si el estudiante tiene acceso a la comunidad
 */
export async function canStudentAccessCommunity(studentId: number): Promise<boolean> {
	return studentHasFeature(studentId, 'communityAccess')
}

/**
 * Verifica si el estudiante tiene soporte por WhatsApp
 */
export async function canStudentUseWhatsAppSupport(studentId: number): Promise<boolean> {
	return studentHasFeature(studentId, 'whatsappSupport')
}

/**
 * Obtiene el tipo de acceso a planificación del estudiante
 */
export async function getStudentPlanificationAccess(
	studentId: number
): Promise<'weekly' | 'monthly' | 'unlimited'> {
	const subscription = await getStudentSubscription(studentId)
	
	if (!subscription) {
		return 'weekly' // default
	}

	const access = subscription.planificationAccess
	if (access === 'monthly' || access === 'unlimited') {
		return access
	}
	
	return 'weekly'
}


