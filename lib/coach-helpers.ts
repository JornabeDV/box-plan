import { prisma } from './prisma'

/**
 * Verifica si un coach tiene acceso activo (suscripción activa o período de prueba válido)
 */
export async function hasCoachAccess(coachId: number): Promise<{
	hasAccess: boolean
	isTrial: boolean
	trialEndsAt: Date | null
	subscription: any | null
}> {
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
				take: 1
			}
		}
	})

	if (!coachProfile) {
		return {
			hasAccess: false,
			isTrial: false,
			trialEndsAt: null,
			subscription: null
		}
	}

	// Si tiene suscripción activa, tiene acceso
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
		}
	}

	// Si no tiene suscripción activa, verificar período de prueba
	if (coachProfile.trialEndsAt) {
		const now = new Date()
		// Asegurar que trialEndsAt sea un objeto Date válido
		const trialEndsAt = coachProfile.trialEndsAt instanceof Date 
			? coachProfile.trialEndsAt 
			: new Date(coachProfile.trialEndsAt)
		
		// Comparar solo las fechas (sin horas) para evitar problemas de zona horaria
		const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const trialDate = new Date(trialEndsAt.getFullYear(), trialEndsAt.getMonth(), trialEndsAt.getDate())
		
		// El período de prueba es válido si la fecha de fin es mayor o igual a hoy
		if (trialDate >= nowDate) {
			return {
				hasAccess: true,
				isTrial: true,
				trialEndsAt: trialEndsAt,
				subscription: null
			}
		}
	} else {
		// Si no tiene trialEndsAt configurado (coach existente), asignar período de prueba automáticamente
		const now = new Date()
		const trialEndsAt = new Date()
		trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7 días desde ahora
		
		// Actualizar el perfil con el período de prueba
		await prisma.coachProfile.update({
			where: { id: coachId },
			data: { trialEndsAt: trialEndsAt }
		})
		
		return {
			hasAccess: true,
			isTrial: true,
			trialEndsAt: trialEndsAt,
			subscription: null
		}
	}

	// No tiene acceso (ni suscripción ni período de prueba válido)
	return {
		hasAccess: false,
		isTrial: false,
		trialEndsAt: coachProfile.trialEndsAt,
		subscription: null
	}
}

/**
 * Obtiene los días restantes del período de prueba
 */
export function getTrialDaysRemaining(trialEndsAt: Date | null): number {
	if (!trialEndsAt) return 0
	
	const now = new Date()
	const end = new Date(trialEndsAt)
	const diffTime = end.getTime() - now.getTime()
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
	
	return Math.max(0, diffDays)
}