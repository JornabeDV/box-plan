/**
 * Tipos y helpers para manejar las funcionalidades según el plan del coach
 */

import { prisma } from './prisma'

/**
 * Tipo de acceso a planificación para alumnos
 */
export type PlanificationAccess = 'daily' | 'monthly' | 'unlimited'

/**
 * Tier de planes de alumnos que puede crear un coach
 */
export type StudentPlanTier = 'basic' | 'standard' | 'premium' | 'vip'

/**
 * Slugs permitidos para planes de coach (solo 3)
 */
export type CoachPlanSlug = 'start' | 'power' | 'elite'

/**
 * Tipos de características disponibles en los planes de coaches
 */
export interface CoachPlanFeatures {
	dashboard_custom?: boolean
	/** Tipo de acceso a planificación: 'daily' | 'monthly' | 'unlimited' */
	planification_access?: PlanificationAccess
	/** @deprecated Usar planification_access */
	planification_unlimited?: boolean
	/** @deprecated Usar planification_access */
	planification_monthly?: boolean
	/** @deprecated Usar planification_access */
	daily_planification?: boolean
	/** @deprecated Usar planification_access */
	planification_weeks?: number
	max_disciplines?: number // 2 para START, 3 para POWER, 999999 para ELITE
	timer?: boolean
	score_loading?: boolean // Para POWER y ELITE
	score_database?: boolean // Para POWER y ELITE
	mercadopago_connection?: boolean // Para POWER
	whatsapp_integration?: boolean // Para POWER y ELITE
	community_forum?: boolean // Para POWER y ELITE
	custom_motivational_quotes?: boolean // Para POWER y ELITE
}

/**
 * Resultado de obtener el plan activo del coach
 */
export interface CoachPlanInfo {
	planId: number
	planName: string
	displayName: string
	slug: string
	features: CoachPlanFeatures
	maxStudents: number
	commissionRate: number
	maxStudentPlans: number
	maxStudentPlanTier: string
	isActive: boolean
	isTrial: boolean
}

/**
 * Mapeo de planificación legacy al nuevo modelo
 * @deprecated Usar planification_access directamente
 */
function mapLegacyPlanification(features: CoachPlanFeatures): PlanificationAccess {
	if (features.planification_unlimited) return 'unlimited'
	if (features.planification_monthly) return 'monthly'
	if (features.daily_planification || features.planification_weeks === 1) return 'daily'
	return 'daily' // default
}

/**
 * Obtiene el tipo de acceso a planificación del plan del coach
 */
export function getPlanificationAccess(features: CoachPlanFeatures): PlanificationAccess {
	// Si ya tiene el nuevo campo, usarlo
	if (features.planification_access) {
		return features.planification_access
	}
	// Sino, mapear desde campos legacy
	return mapLegacyPlanification(features)
}

/**
 * Obtiene el plan activo del coach con sus características
 */
export async function getCoachActivePlan(coachId: number): Promise<CoachPlanInfo | null> {
	console.log('[getCoachActivePlan] Buscando plan para coachId:', coachId)
	
	const coachProfile = await prisma.coachProfile.findUnique({
		where: { id: coachId },
		include: {
			subscriptions: {
				where: {
					status: {
						in: ['active', 'Active', 'ACTIVE']
					}
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
		console.log('[getCoachActivePlan] No se encontró coachProfile para id:', coachId)
		return null
	}

	console.log('[getCoachActivePlan] CoachProfile encontrado. Suscripciones activas:', coachProfile.subscriptions.length)

	// Si tiene suscripción activa, usar ese plan
	if (coachProfile.subscriptions.length > 0) {
		const subscription = coachProfile.subscriptions[0]
		const plan = subscription.plan
		const now = new Date()

		// Comparar solo por fecha (sin hora) para evitar problemas de zona horaria
		const periodEndDate = new Date(subscription.currentPeriodEnd.getFullYear(), subscription.currentPeriodEnd.getMonth(), subscription.currentPeriodEnd.getDate())
		const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		
		console.log('[getCoachActivePlan] Suscripción encontrada:', {
			id: subscription.id,
			currentPeriodEnd: subscription.currentPeriodEnd,
			periodEndDate: periodEndDate,
			nowDate: nowDate,
			isValid: periodEndDate >= nowDate
		})

		if (periodEndDate >= nowDate) {
			const features = plan.features as CoachPlanFeatures || {}
			
			console.log('[getCoachActivePlan] Retornando plan:', plan.name)
			return {
				planId: plan.id,
				planName: plan.name,
				displayName: plan.displayName,
				slug: plan.slug,
				features,
				maxStudents: plan.maxStudents,
				commissionRate: Number(plan.commissionRate),
				maxStudentPlans: plan.maxStudentPlans,
				maxStudentPlanTier: plan.maxStudentPlanTier,
				isActive: true,
				isTrial: false
			}
		} else {
			console.log('[getCoachActivePlan] Suscripción expirada. periodEndDate:', periodEndDate, 'nowDate:', nowDate)
		}
	} else {
		console.log('[getCoachActivePlan] No hay suscripciones activas. Verificando trial...')
	}

	// Si está en período de prueba, usar plan START por defecto
	if (coachProfile.trialEndsAt) {
		const now = new Date()
		const trialEndsAt = coachProfile.trialEndsAt instanceof Date
			? coachProfile.trialEndsAt
			: new Date(coachProfile.trialEndsAt)
		
		const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const trialDate = new Date(trialEndsAt.getFullYear(), trialEndsAt.getMonth(), trialEndsAt.getDate())

		console.log('[getCoachActivePlan] Verificando trial:', {
			trialEndsAt: coachProfile.trialEndsAt,
			nowDate: nowDate,
			trialDate: trialDate,
			isValid: trialDate >= nowDate
		})

		if (trialDate >= nowDate) {
			// Obtener plan START como plan por defecto del trial
			const startPlan = await prisma.coachPlanType.findUnique({
				where: { slug: 'start' }
			})

			if (startPlan) {
				const features = startPlan.features as CoachPlanFeatures || {}
				
				console.log('[getCoachActivePlan] Retornando plan START de trial')
				return {
					planId: startPlan.id,
					planName: startPlan.name,
					displayName: startPlan.displayName,
					slug: startPlan.slug,
					features,
					maxStudents: startPlan.maxStudents,
					commissionRate: Number(startPlan.commissionRate),
					maxStudentPlans: startPlan.maxStudentPlans,
					maxStudentPlanTier: startPlan.maxStudentPlanTier,
					isActive: true,
					isTrial: true
				}
			}
		}
	}

	console.log('[getCoachActivePlan] No se encontró plan activo ni trial válido')
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
 * @deprecated Usar getPlanificationAccess() === 'monthly' | 'unlimited'
 */
export async function canCoachLoadMonthlyPlanifications(coachId: number): Promise<boolean> {
	const planInfo = await getCoachActivePlan(coachId)
	
	if (!planInfo) {
		return false
	}

	const access = getPlanificationAccess(planInfo.features)
	return access === 'monthly' || access === 'unlimited'
}

/**
 * Verifica si el coach puede cargar planificaciones sin límite
 * @deprecated Usar getPlanificationAccess() === 'unlimited'
 */
export async function canCoachLoadUnlimitedPlanifications(coachId: number): Promise<boolean> {
	const planInfo = await getCoachActivePlan(coachId)
	
	if (!planInfo) {
		return false
	}

	return getPlanificationAccess(planInfo.features) === 'unlimited'
}

/**
 * Obtiene el tipo de acceso a planificación del coach
 */
export async function getCoachPlanificationAccess(coachId: number): Promise<PlanificationAccess> {
	const planInfo = await getCoachActivePlan(coachId)
	
	if (!planInfo) {
		return 'daily'
	}

	return getPlanificationAccess(planInfo.features)
}

/**
 * Verifica si el coach puede usar MercadoPago
 */
export async function canCoachUseMercadoPago(coachId: number): Promise<boolean> {
	return coachHasFeature(coachId, 'mercadopago_connection')
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

/**
 * Verifica si el coach puede usar frases motivacionales personalizadas
 */
export async function canCoachUseCustomMotivationalQuotes(coachId: number): Promise<boolean> {
	return coachHasFeature(coachId, 'custom_motivational_quotes')
}

/**
 * @deprecated Usar getCoachPlanificationAccess()
 */
export async function getCoachPlanificationWeeks(coachId: number): Promise<number> {
	const planInfo = await getCoachActivePlan(coachId)
	
	if (!planInfo) {
		return 0
	}

	// Para compatibilidad hacia atrás, devolver 1 si es acceso diario
	const access = getPlanificationAccess(planInfo.features)
	return access === 'daily' ? 1 : 0
}

/**
 * Obtiene el tier máximo de plan de alumno que puede crear el coach
 */
export async function getCoachMaxStudentPlanTier(coachId: number): Promise<StudentPlanTier> {
	const coachProfile = await prisma.coachProfile.findUnique({
		where: { id: coachId },
		include: {
			subscriptions: {
				where: { status: { in: ['active', 'Active', 'ACTIVE'] } },
				orderBy: { currentPeriodEnd: 'desc' },
				take: 1,
				include: { plan: true }
			}
		}
	})

	if (!coachProfile || coachProfile.subscriptions.length === 0) {
		return 'basic'
	}

	const plan = coachProfile.subscriptions[0].plan
	return (plan.maxStudentPlanTier as StudentPlanTier) || 'basic'
}

/**
 * Obtiene la cantidad máxima de planes de alumnos que puede crear el coach
 */
export async function getCoachMaxStudentPlans(coachId: number): Promise<number> {
	const coachProfile = await prisma.coachProfile.findUnique({
		where: { id: coachId },
		include: {
			subscriptions: {
				where: { status: { in: ['active', 'Active', 'ACTIVE'] } },
				orderBy: { currentPeriodEnd: 'desc' },
				take: 1,
				include: { plan: true }
			}
		}
	})

	if (!coachProfile || coachProfile.subscriptions.length === 0) {
		return 2 // Default START
	}

	const plan = coachProfile.subscriptions[0].plan
	return plan.maxStudentPlans || 2
}

/**
 * Verifica si un tier de plan de alumno está permitido para el coach
 */
export function isStudentTierAllowed(
	coachTier: StudentPlanTier,
	targetTier: StudentPlanTier
): boolean {
	const tierLevels: Record<StudentPlanTier, number> = {
		'basic': 1,
		'standard': 2,
		'premium': 3,
		'vip': 4
	}
	
	return tierLevels[targetTier] <= tierLevels[coachTier]
}
