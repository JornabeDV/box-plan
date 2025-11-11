import { prisma } from './prisma'

/**
 * Verifica si un usuario es coach
 * Retorna el perfil de coach
 */
export async function isCoach(userId: number | string) {
	const userIdNumber = typeof userId === 'string' ? parseInt(userId) : userId
	const coachProfile = await prisma.coachProfile.findUnique({
		where: { userId: userIdNumber }
	})

	if (coachProfile) {
		return { isAuthorized: true, profile: coachProfile, profileType: 'coach' as const }
	}

	return { isAuthorized: false, profile: null, profileType: null }
}

