import { prisma } from './prisma'

/**
 * Transforma una disciplina de Prisma al formato esperado por el frontend
 */
function transformDiscipline(discipline: any) {
	return {
		id: String(discipline.id),
		name: discipline.name,
		description: discipline.description || undefined,
		color: discipline.color,
		order_index: discipline.orderIndex,
		is_active: discipline.isActive,
		coach_id: String(discipline.coachId),
		created_at: discipline.createdAt.toISOString(),
		updated_at: discipline.updatedAt.toISOString(),
		levels: discipline.levels?.map((level: any) => ({
			id: String(level.id),
			discipline_id: String(level.disciplineId),
			name: level.name,
			description: level.description || undefined,
			order_index: level.orderIndex,
			is_active: level.isActive,
			created_at: level.createdAt.toISOString(),
			updated_at: level.updatedAt.toISOString()
		})) || []
	}
}

/**
 * Tipos para los datos del dashboard
 */
export interface DashboardDisciplines {
	disciplines: any[]
	levels: any[]
}

export interface DashboardUsers {
	id: string
	email: string
	full_name: string | null
	avatar_url: string | null
	created_at: string
	updated_at: string
	subscription: any | null
	preferences: any | null
}

export interface DashboardPlanifications {
	id: number
	disciplineId: number | null
	disciplineLevelId: number | null
	coachId: number | null
	date: string | Date
	title: string | null
	description: string | null
	exercises: any
	notes: string | null
	isCompleted: boolean
	createdAt: Date
	updatedAt: Date
	discipline: any | null
	discipline_level: any | null
}

export interface DashboardCoachAccess {
	hasAccess: boolean
	isTrial: boolean
	trialEndsAt: Date | null
	subscription: any | null
}

/**
 * Carga disciplinas con sus niveles
 */
export async function loadDashboardDisciplines(coachId: number): Promise<DashboardDisciplines> {
	const disciplines = await prisma.discipline.findMany({
		where: {
			coachId,
			isActive: true
		},
		include: {
			levels: {
				where: { isActive: true },
				orderBy: { orderIndex: 'asc' }
			}
		},
		orderBy: { orderIndex: 'asc' }
	})

	// Transformar disciplinas al formato esperado por el frontend
	const disciplinesWithLevels = disciplines.map(transformDiscipline)

	// Extraer niveles para respuesta separada
	const levels = disciplinesWithLevels.flatMap(d => d.levels || [])

	return {
		disciplines: disciplinesWithLevels,
		levels
	}
}

/**
 * Carga planificaciones con sus relaciones
 */
export async function loadDashboardPlanifications(coachId: number): Promise<DashboardPlanifications[]> {
	const planifications = await prisma.planification.findMany({
		where: { coachId },
		select: {
			id: true,
			disciplineId: true,
			disciplineLevelId: true,
			coachId: true,
			date: true,
			title: true,
			description: true,
			exercises: true,
			notes: true,
			isCompleted: true,
			createdAt: true,
			updatedAt: true,
			discipline: {
				select: {
					id: true,
					name: true,
					color: true
				}
			},
			disciplineLevel: {
				select: {
					id: true,
					name: true,
					description: true
				}
			}
		},
		orderBy: { date: 'asc' }
	})

	return planifications.map(p => {
		// Transformar exercises (JSON) a blocks para el frontend
		const exercisesData = (p as any).exercises
		const blocksData = exercisesData ? (Array.isArray(exercisesData) ? exercisesData : []) : []
		
		return {
			...p,
			date: p.date instanceof Date ? p.date.toISOString().split('T')[0] : p.date,
			blocks: blocksData, // Agregar blocks para compatibilidad con el frontend
			exercises: exercisesData, // Mantener exercises también
			discipline: p.discipline ? {
				id: p.discipline.id,
				name: p.discipline.name,
				color: p.discipline.color
			} : null,
			discipline_level: p.disciplineLevel ? {
				id: p.disciplineLevel.id,
				name: p.disciplineLevel.name,
				description: p.disciplineLevel.description
			} : null
		}
	})
}

/**
 * Carga usuarios con sus suscripciones y preferencias
 * Filtra por estudiantes asociados al coach a través de CoachStudentRelationship
 */
export async function loadDashboardUsers(coachId: number): Promise<DashboardUsers[]> {
	// Primero obtener las relaciones activas del coach con estudiantes
	const relationships = await prisma.coachStudentRelationship.findMany({
		where: {
			coachId: coachId,
			status: 'active'
		},
		select: {
			studentId: true
		}
	})

	// Si no hay estudiantes asociados, retornar array vacío
	if (relationships.length === 0) {
		return []
	}

	// Obtener IDs de estudiantes
	const studentIds = relationships.map(r => r.studentId)

	const users = await prisma.user.findMany({
		where: {
			id: { in: studentIds }
		},
		select: {
			id: true,
			email: true,
			name: true,
			image: true,
			createdAt: true,
			updatedAt: true,
			subscriptions: {
				// Obtener la suscripción más reciente sin importar su estado
				// para poder mostrar información histórica de suscripciones canceladas
				include: {
					plan: {
						select: {
							id: true,
							name: true,
							description: true,
							price: true,
							currency: true,
							interval: true,
							features: true,
							isActive: true
						}
					}
				},
				take: 1,
				orderBy: { createdAt: 'desc' }
			},
			userPreferences: {
				select: {
					id: true,
					preferredDisciplineId: true,
					preferredLevelId: true,
					createdAt: true,
					updatedAt: true
				}
			}
		},
		orderBy: { createdAt: 'desc' }
	})

	// Cargar disciplinas y niveles para las preferencias
	const disciplineIds = [...new Set(users
		.map(u => u.userPreferences?.preferredDisciplineId)
		.filter((id): id is number => id !== null && id !== undefined)
	)]
	
	const levelIds = [...new Set(users
		.map(u => u.userPreferences?.preferredLevelId)
		.filter((id): id is number => id !== null && id !== undefined)
	)]

	// Cargar disciplinas y niveles en paralelo
	const [disciplines, levels] = await Promise.all([
		disciplineIds.length > 0
			? prisma.discipline.findMany({
					where: { 
						id: { in: disciplineIds },
						isActive: true
					},
					select: { id: true, name: true, color: true }
				})
			: Promise.resolve([]),
		levelIds.length > 0
			? prisma.disciplineLevel.findMany({
					where: { 
						id: { in: levelIds },
						isActive: true
					},
					select: { id: true, name: true, description: true }
				})
			: Promise.resolve([])
	])

	// Crear mapas para acceso rápido
	const disciplineMap = new Map(disciplines.map(d => [d.id, d]))
	const levelMap = new Map(levels.map(l => [l.id, l]))

	return users.map(user => {
		const subscription = user.subscriptions[0] || null
		const preferences = user.userPreferences

		// Buscar disciplina y nivel usando los IDs de las preferencias
		const discipline = preferences?.preferredDisciplineId
			? disciplineMap.get(preferences.preferredDisciplineId)
			: null
		const level = preferences?.preferredLevelId
			? levelMap.get(preferences.preferredLevelId)
			: null

		return {
			id: String(user.id),
			email: user.email,
			full_name: user.name,
			avatar_url: user.image,
			created_at: user.createdAt.toISOString(),
			updated_at: user.updatedAt.toISOString(),
			// has_subscription debe ser true solo si la suscripción está activa
			has_subscription: subscription?.status === 'active',
			subscription_status: subscription?.status || null,
			subscription: subscription && subscription.plan ? {
				id: String(subscription.id),
				user_id: String(subscription.userId),
				plan_id: String(subscription.planId),
				status: subscription.status,
				current_period_start: subscription.currentPeriodStart.toISOString(),
				current_period_end: subscription.currentPeriodEnd.toISOString(),
				cancel_at_period_end: subscription.cancelAtPeriodEnd,
				payment_method: (subscription as any).paymentMethod || null,
				plan: {
					id: String(subscription.plan.id),
					name: subscription.plan.name,
					description: subscription.plan.description,
					price: Number(subscription.plan.price),
					currency: subscription.plan.currency,
					interval: subscription.plan.interval,
					features: subscription.plan.features,
					is_active: subscription.plan.isActive
				}
			} : null,
			preferences: preferences ? {
				id: String(preferences.id || ''),
				user_id: String(user.id),
				preferred_discipline_id: preferences.preferredDisciplineId ? String(preferences.preferredDisciplineId) : null,
				preferred_level_id: preferences.preferredLevelId ? String(preferences.preferredLevelId) : null,
				created_at: preferences.createdAt?.toISOString() || new Date().toISOString(),
				updated_at: preferences.updatedAt?.toISOString() || new Date().toISOString(),
				discipline: discipline ? {
					id: String(discipline.id),
					name: discipline.name,
					color: discipline.color
				} : null,
				level: level ? {
					id: String(level.id),
					name: level.name,
					description: level.description
				} : null
			} : null
		}
	})
}

/**
 * Carga planes de suscripción del coach
 */
export async function loadDashboardSubscriptionPlans(coachId: number): Promise<any[]> {
	const plans = await prisma.subscriptionPlan.findMany({
		where: { coachId },
		select: {
			id: true,
			name: true,
			description: true,
			price: true,
			currency: true,
			interval: true,
			features: true,
			isActive: true,
			coachId: true
		},
		orderBy: { price: 'asc' }
	})

	return plans.map(plan => ({
		...plan,
		is_active: plan.isActive,
		features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
		is_popular: plan.name === 'Pro'
	}))
}

/**
 * Calcula el acceso del coach basado en su perfil
 */
export function calculateCoachAccess(coachProfile: {
	trialEndsAt: Date | null
	subscriptions: Array<{
		currentPeriodEnd: Date
	}>
}): DashboardCoachAccess {
	if (coachProfile.subscriptions.length > 0) {
		const activeSubscription = coachProfile.subscriptions[0]
		const now = new Date()
		
		if (activeSubscription.currentPeriodEnd > now) {
			return {
				hasAccess: true,
				isTrial: false,
				trialEndsAt: null,
				subscription: activeSubscription
			}
		} else {
			return {
				hasAccess: false,
				isTrial: false,
				trialEndsAt: null,
				subscription: null
			}
		}
	} else if (coachProfile.trialEndsAt) {
		const now = new Date()
		const trialEndsAt = coachProfile.trialEndsAt instanceof Date 
			? coachProfile.trialEndsAt 
			: new Date(coachProfile.trialEndsAt)
		
		const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const trialDate = new Date(trialEndsAt.getFullYear(), trialEndsAt.getMonth(), trialEndsAt.getDate())
		
		if (trialDate >= nowDate) {
			return {
				hasAccess: true,
				isTrial: true,
				trialEndsAt: trialEndsAt,
				subscription: null
			}
		} else {
			return {
				hasAccess: false,
				isTrial: false,
				trialEndsAt: trialEndsAt,
				subscription: null
			}
		}
	} else {
		return {
			hasAccess: false,
			isTrial: false,
			trialEndsAt: null,
			subscription: null
		}
	}
}

/**
 * Obtiene el coachId del usuario autenticado
 */
export async function getCoachIdFromUser(userId: number): Promise<number | null> {
	const userRole = await prisma.userRole.findFirst({
		where: { userId },
		orderBy: { createdAt: 'desc' }
	})

	if (userRole?.role === 'coach') {
		const coachProfile = await prisma.coachProfile.findUnique({
			where: { userId },
			select: { id: true }
		})
		return coachProfile?.id || null
	}

	return null
}

/**
 * Carga el perfil del coach con sus suscripciones
 */
export async function loadCoachProfile(coachId: number) {
	return await prisma.coachProfile.findUnique({
		where: { id: coachId },
		include: {
			subscriptions: {
				where: { status: 'active' },
				orderBy: { currentPeriodEnd: 'desc' },
				take: 1
			}
		}
	})
}