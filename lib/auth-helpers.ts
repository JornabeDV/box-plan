/**
 * Normaliza el ID de usuario de la sesión a número
 * NextAuth puede devolver el ID como string en runtime aunque TypeScript lo tipa como number
 */
export function normalizeUserId(userId: number | string | undefined): number | null {
	if (!userId) return null
	return typeof userId === 'string' ? parseInt(userId, 10) : userId
}

/**
 * Verifica si un usuario es coach
 * Retorna el perfil de coach
 */
export async function isCoach(userId: number | string) {
	const { prisma } = await import('./prisma')

	const userIdNumber = typeof userId === 'string' ? parseInt(userId) : userId
	const coachProfile = await prisma.coachProfile.findUnique({
		where: { userId: userIdNumber }
	})

	if (coachProfile) {
		return { isAuthorized: true, profile: coachProfile, profileType: 'coach' as const }
	}

	return { isAuthorized: false, profile: null, profileType: null }
}

