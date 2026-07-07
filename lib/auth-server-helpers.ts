import { NextResponse } from 'next/server'
import { prisma } from './prisma'

/**
 * Normaliza el ID de usuario de la sesión a número
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
	const userIdNumber = typeof userId === 'string' ? parseInt(userId) : userId
	const coachProfile = await prisma.coachProfile.findUnique({
		where: { userId: userIdNumber }
	})

	if (coachProfile) {
		return { isAuthorized: true, profile: coachProfile, profileType: 'coach' as const }
	}

	return { isAuthorized: false, profile: null, profileType: null }
}

/**
 * Verifica si un usuario tiene rol admin en la base de datos
 */
export async function isAdmin(userId: number | string) {
	const userIdNumber = typeof userId === 'string' ? parseInt(userId) : userId

	const adminRole = await prisma.userRole.findFirst({
		where: { userId: userIdNumber, role: 'admin' }
	})

	return !!adminRole
}

/**
 * Verifica si un usuario tiene rol superadmin en la base de datos
 */
export async function isSuperAdmin(userId: number | string) {
	const userIdNumber = typeof userId === 'string' ? parseInt(userId) : userId

	const superAdminRole = await prisma.userRole.findFirst({
		where: { userId: userIdNumber, role: 'superadmin' }
	})

	return !!superAdminRole
}

/**
 * Verifica si un usuario es administrador (admin o superadmin) en la base de datos
 */
export async function isAnyAdmin(userId: number | string) {
	const userIdNumber = typeof userId === 'string' ? parseInt(userId) : userId

	const adminRole = await prisma.userRole.findFirst({
		where: {
			userId: userIdNumber,
			role: { in: ['admin', 'superadmin'] }
		}
	})

	return !!adminRole
}

/**
 * Verifica si un coach tiene una relación activa con un estudiante
 */
export async function isCoachOfStudent(coachId: number, studentId: number) {
	const relationship = await prisma.coachStudentRelationship.findFirst({
		where: {
			coachId,
			studentId,
			status: 'active'
		}
	})

	return !!relationship
}

/**
 * Helper para respuestas 403 estándar
 */
export function forbidden(message = 'No autorizado') {
	return NextResponse.json({ error: message }, { status: 403 })
}
