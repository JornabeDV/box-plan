/**
 * Normaliza el ID de usuario de la sesión a número
 * NextAuth puede devolver el ID como string en runtime aunque TypeScript lo tipa como number
 */
export function normalizeUserId(userId: number | string | undefined): number | null {
	if (!userId) return null
	return typeof userId === 'string' ? parseInt(userId, 10) : userId
}
