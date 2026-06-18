import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const getCachedUserCoach = unstable_cache(
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

/**
 * GET /api/user-coach
 * Obtiene el coach asignado al usuario autenticado
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

		const result = await getCachedUserCoach(userId)
		const response = NextResponse.json(result)
		response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
		return response
	} catch (error) {
		console.error('Error fetching user coach:', error)
		return NextResponse.json(
			{ error: 'Error al cargar la información del coach' },
			{ status: 500 }
		)
	}
}
