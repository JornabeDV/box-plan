import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

// User role
export const getCachedUserRole = unstable_cache(
	async (userId: number) => {
		const userRole = await prisma.userRole.findFirst({
			where: { userId },
			orderBy: { createdAt: 'desc' }
		})

		if (!userRole) {
			return { role: null, adminProfile: null, coachProfile: null }
		}

		const [adminProfile, coachProfile] = await Promise.all([
			userRole.role === 'admin'
				? prisma.adminProfile.findUnique({ where: { userId } })
				: Promise.resolve(null),
			userRole.role === 'coach'
				? prisma.coachProfile.findUnique({ where: { userId } })
				: Promise.resolve(null)
		])

		return { role: userRole, adminProfile, coachProfile }
	},
	['user-role'],
	{ revalidate: 300, tags: ['user-role'] }
)

// Profile
export const getCachedProfile = unstable_cache(
	async (userId: number) => {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				name: true,
				image: true,
				phone: true,
				createdAt: true,
				updatedAt: true
			}
		})

		if (!user) {
			return null
		}

		return {
			id: user.id,
			full_name: user.name || user.email,
			avatar_url: user.image,
			phone: user.phone,
			created_at: user.createdAt,
			updated_at: user.updatedAt
		}
	},
	['profile'],
	{ revalidate: 300, tags: ['profile'] }
)

// Current subscription (with expiration check)
export const getCachedCurrentSubscription = unstable_cache(
	async (userId: number) => {
		const subscription = await prisma.subscription.findFirst({
			where: {
				userId,
				status: { in: ['active', 'expired', 'past_due'] }
			},
			include: {
				plan: {
					select: {
						id: true,
						name: true,
						price: true,
						currency: true,
						interval: true,
						features: true,
						planificationAccess: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		})

		if (!subscription) {
			return { data: null }
		}

		const now = new Date()
		const isExpired = subscription.currentPeriodEnd < now

		if ((subscription.status === 'active' || subscription.status === 'past_due') && isExpired) {
			await prisma.subscription.update({
				where: { id: subscription.id },
				data: { status: 'expired' }
			})
		}

		const result = {
			id: subscription.id,
			user_id: subscription.userId,
			plan_id: subscription.planId,
			status: isExpired ? 'expired' : subscription.status,
			current_period_start: subscription.currentPeriodStart.toISOString(),
			current_period_end: subscription.currentPeriodEnd.toISOString(),
			cancel_at_period_end: subscription.cancelAtPeriodEnd,
			mercadopago_payment_id: subscription.mercadopagoPaymentId,
			payment_method: subscription.paymentMethod || null,
			created_at: subscription.createdAt.toISOString(),
			updated_at: subscription.updatedAt.toISOString(),
			is_expired: isExpired,
			subscription_plans: {
				id: subscription.plan.id,
				name: subscription.plan.name,
				price: Number(subscription.plan.price),
				currency: subscription.plan.currency,
				interval: subscription.plan.interval,
				features: subscription.plan.features,
				planificationAccess: subscription.plan.planificationAccess
			}
		}

		return { data: result }
	},
	['current-subscription'],
	{ revalidate: 60, tags: ['current-subscription'] }
)

// Active subscription (used by useProfile)
export const getCachedSubscription = unstable_cache(
	async (userId: number) => {
		const subscription = await prisma.subscription.findFirst({
			where: {
				userId,
				status: 'active'
			},
			include: {
				plan: {
					select: {
						name: true,
						price: true,
						features: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		})

		if (!subscription) {
			return null
		}

		return {
			id: subscription.id.toString(),
			user_id: subscription.userId.toString(),
			plan_id: subscription.planId.toString(),
			status: subscription.status,
			current_period_start: subscription.currentPeriodStart.toISOString(),
			current_period_end: subscription.currentPeriodEnd.toISOString(),
			cancel_at_period_end: subscription.cancelAtPeriodEnd,
			mercadopago_subscription_id: null,
			mercadopago_payment_id: subscription.mercadopagoPaymentId || null,
			created_at: subscription.createdAt.toISOString(),
			updated_at: subscription.updatedAt.toISOString(),
			subscription_plans: subscription.plan ? {
				name: subscription.plan.name,
				price: Number(subscription.plan.price),
				features: subscription.plan.features
			} : undefined
		}
	},
	['subscription'],
	{ revalidate: 300, tags: ['subscription'] }
)

// User coach
export const getCachedUserCoach = unstable_cache(
	async (userId: number) => {
		const relationship = await prisma.coachStudentRelationship.findFirst({
			where: {
				studentId: userId,
				status: 'active'
			},
			include: {
				coach: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					}
				}
			}
		})

		if (!relationship) {
			return {
				success: true,
				coach: null,
				message: 'No tienes un coach asignado'
			}
		}

		return {
			success: true,
			coach: {
				id: relationship.coach.id,
				userId: relationship.coach.userId,
				name: relationship.coach.user.name || relationship.coach.businessName || 'Coach',
				email: relationship.coach.user.email,
				image: relationship.coach.user.image,
				businessName: relationship.coach.businessName,
				phone: relationship.coach.phone,
				address: relationship.coach.address,
				logoUrl: relationship.coach.logoUrl,
				joinedAt: relationship.joinedAt
			},
			relationship: {
				id: relationship.id,
				status: relationship.status,
				joinedAt: relationship.joinedAt
			}
		}
	},
	['user-coach'],
	{ revalidate: 300, tags: ['user-coach'] }
)

// Student coach
export const getCachedStudentCoach = unstable_cache(
	async (userId: number) => {
		const relationship = await prisma.coachStudentRelationship.findFirst({
			where: {
				studentId: userId,
				status: 'active'
			},
			include: {
				coach: {
					include: {
						user: {
							select: {
								email: true
							}
						}
					}
				}
			}
		})

		if (!relationship) {
			return {
				data: null,
				message: 'El usuario no está asociado a ningún coach activo'
			}
		}

		return {
			data: {
				id: relationship.coach.id,
				businessName: relationship.coach.businessName,
				phone: relationship.coach.phone,
				email: relationship.coach.user.email
			}
		}
	},
	['student-coach'],
	{ revalidate: 300, tags: ['student-coach'] }
)

// User disciplines
export const getCachedUserDisciplines = unstable_cache(
	async (userId: number) => {
		return prisma.userDiscipline.findMany({
			where: { userId },
			include: {
				discipline: {
					select: {
						id: true,
						name: true,
						color: true,
						description: true
					}
				},
				level: {
					select: {
						id: true,
						name: true,
						description: true
					}
				},
				preferredLevel: {
					select: {
						id: true,
						name: true,
						description: true
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		})
	},
	['user-disciplines'],
	{ revalidate: 300, tags: ['user-disciplines'] }
)

// User preferences
export const getCachedUserPreferences = unstable_cache(
	async (userId: number) => {
		const preference = await prisma.userPreference.findUnique({
			where: { userId }
		})

		if (!preference) {
			return null
		}

		const [discipline, level, activeSubscription] = await Promise.all([
			preference.preferredDisciplineId
				? prisma.discipline.findUnique({
					where: { id: preference.preferredDisciplineId },
					select: { id: true, name: true, color: true }
				})
				: Promise.resolve(null),
			preference.preferredLevelId
				? prisma.disciplineLevel.findUnique({
					where: { id: preference.preferredLevelId },
					select: { id: true, name: true, description: true }
				})
				: Promise.resolve(null),
			prisma.subscription.findFirst({
				where: {
					userId,
					status: 'active'
				},
				orderBy: {
					currentPeriodStart: 'desc'
				}
			})
		])

		let lockStatus: {
			isLocked: boolean
			nextChangeDate: string | null
			message: string | null
		} = {
			isLocked: false,
			nextChangeDate: null,
			message: null
		}

		if (activeSubscription && preference.lastPreferenceChangeDate) {
			const lastChangeDate = new Date(preference.lastPreferenceChangeDate)
			const periodStart = new Date(activeSubscription.currentPeriodStart)
			const periodEnd = new Date(activeSubscription.currentPeriodEnd)

			if (lastChangeDate >= periodStart) {
				lockStatus = {
					isLocked: true,
					nextChangeDate: periodEnd.toISOString(),
					message: 'Ya has cambiado tus preferencias este mes. Solo puedes cambiar tu disciplina una vez por período de suscripción. Podrás cambiarlas nuevamente después de tu próximo pago.'
				}
			}
		}

		return {
			...preference,
			discipline_id: discipline?.id || null,
			discipline_name: discipline?.name || null,
			discipline_color: discipline?.color || null,
			level_id: level?.id || null,
			level_name: level?.name || null,
			level_description: level?.description || null,
			lock_status: lockStatus
		}
	},
	['user-preferences'],
	{ revalidate: 300, tags: ['user-preferences'] }
)

// Payment history
export const getCachedPaymentHistory = unstable_cache(
	async (userId: number) => {
		const paymentHistory = await prisma.paymentHistory.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			take: 10
		})

		return paymentHistory.map((payment) => ({
			id: payment.id.toString(),
			user_id: payment.userId.toString(),
			subscription_id: payment.subscriptionId?.toString() || null,
			amount: Number(payment.amount),
			currency: payment.currency,
			status: payment.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
			mercadopago_payment_id: payment.mercadopagoPaymentId,
			mercadopago_preference_id: payment.mercadopagoPreferenceId,
			payment_method: payment.paymentMethod,
			created_at: payment.createdAt.toISOString(),
			updated_at: payment.updatedAt.toISOString()
		}))
	},
	['payment-history'],
	{ revalidate: 300, tags: ['payment-history'] }
)

// Coach profile
export const getCachedCoachProfile = unstable_cache(
	async (profileId: number) => {
		const coachProfile = await prisma.coachProfile.findUnique({
			where: { id: profileId },
			include: {
				user: {
					select: {
						email: true,
						name: true
					}
				}
			}
		})

		if (!coachProfile) {
			return null
		}

		return {
			profile: {
				id: coachProfile.id,
				businessName: coachProfile.businessName,
				phone: coachProfile.phone,
				address: coachProfile.address,
				logoUrl: coachProfile.logoUrl,
				maxStudents: coachProfile.maxStudents,
				currentStudentCount: coachProfile.currentStudentCount,
				commissionRate: Number(coachProfile.commissionRate),
				platformCommissionRate: Number(coachProfile.platformCommissionRate),
				mercadopagoAccountId: coachProfile.mercadopagoAccountId,
				email: coachProfile.user.email,
				name: coachProfile.user.name,
				createdAt: coachProfile.createdAt.toISOString(),
				updatedAt: coachProfile.updatedAt.toISOString()
			}
		}
	},
	['coach-profile'],
	{ revalidate: 300, tags: ['coach-profile'] }
)
