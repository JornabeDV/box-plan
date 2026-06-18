import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache, revalidateTag } from 'next/cache'
import { auth } from '@/lib/auth'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const getCachedCoachProfile = unstable_cache(
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

/**
 * GET /api/coaches/profile
 * Obtiene el perfil del coach autenticado
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		if (!userId) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		// Verificar que el usuario es coach
		const authCheck = await isCoach(userId)

		if (!authCheck.isAuthorized || !authCheck.profile) {
			return NextResponse.json(
				{ error: 'No autorizado. Solo coaches pueden acceder.' },
				{ status: 403 }
			)
		}

		const result = await getCachedCoachProfile(authCheck.profile.id)

		if (!result) {
			return NextResponse.json(
				{ error: 'Perfil de coach no encontrado' },
				{ status: 404 }
			)
		}

		const response = NextResponse.json(result)
		response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
		return response
	} catch (error) {
		console.error('Error fetching coach profile:', error)
		return NextResponse.json(
			{ error: 'Error al obtener el perfil del coach' },
			{ status: 500 }
		)
	}
}

/**
 * PATCH /api/coaches/profile
 * Actualiza el perfil del coach autenticado
 */
export async function PATCH(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		if (!userId) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		// Verificar que el usuario es coach
		const authCheck = await isCoach(userId)

		if (!authCheck.isAuthorized || !authCheck.profile) {
			return NextResponse.json(
				{ error: 'No autorizado. Solo coaches pueden realizar esta acción.' },
				{ status: 403 }
			)
		}

		const body = await request.json()
		const { businessName, phone, address } = body

		// Validar datos
		if (businessName !== undefined && typeof businessName !== 'string') {
			return NextResponse.json(
				{ error: 'businessName debe ser un string' },
				{ status: 400 }
			)
		}

		if (phone !== undefined && typeof phone !== 'string') {
			return NextResponse.json(
				{ error: 'phone debe ser un string' },
				{ status: 400 }
			)
		}

		if (address !== undefined && typeof address !== 'string') {
			return NextResponse.json(
				{ error: 'address debe ser un string' },
				{ status: 400 }
			)
		}

		// Preparar datos de actualización
		const updateData: any = {}
		if (businessName !== undefined) updateData.businessName = businessName || null
		if (phone !== undefined) updateData.phone = phone || null
		if (address !== undefined) updateData.address = address || null

		// Actualizar perfil
		const updatedProfile = await prisma.coachProfile.update({
			where: { id: authCheck.profile.id },
			data: updateData,
			include: {
				user: {
					select: {
						email: true,
						name: true
					}
				}
			}
		})

		// Invalidar caché del perfil
		revalidateTag('coach-profile')

		return NextResponse.json({
			success: true,
			profile: {
				id: updatedProfile.id,
				businessName: updatedProfile.businessName,
				phone: updatedProfile.phone,
				address: updatedProfile.address,
				logoUrl: updatedProfile.logoUrl,
				maxStudents: updatedProfile.maxStudents,
				currentStudentCount: updatedProfile.currentStudentCount,
				commissionRate: Number(updatedProfile.commissionRate),
				platformCommissionRate: Number(updatedProfile.platformCommissionRate),
				mercadopagoAccountId: updatedProfile.mercadopagoAccountId,
				email: updatedProfile.user.email,
				name: updatedProfile.user.name,
				createdAt: updatedProfile.createdAt.toISOString(),
				updatedAt: updatedProfile.updatedAt.toISOString()
			}
		})
	} catch (error) {
		console.error('Error updating coach profile:', error)
		return NextResponse.json(
			{ error: 'Error al actualizar el perfil del coach' },
			{ status: 500 }
		)
	}
}
