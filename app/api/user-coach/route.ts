import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

		// Obtener la relación activa con el coach
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
			return NextResponse.json({
				success: true,
				coach: null,
				message: 'No tienes un coach asignado'
			})
		}

		return NextResponse.json({
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
				joinedAt: relationship.joinedAt
			},
			relationship: {
				id: relationship.id,
				status: relationship.status,
				joinedAt: relationship.joinedAt
			}
		})
	} catch (error) {
		console.error('Error fetching user coach:', error)
		return NextResponse.json(
			{ error: 'Error al cargar la información del coach' },
			{ status: 500 }
		)
	}
}