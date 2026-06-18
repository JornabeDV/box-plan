import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const getCachedStudentCoach = unstable_cache(
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

// GET /api/student/coach
// Obtiene la información del coach asignado al estudiante
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		
		const userId = normalizeUserId(session?.user?.id)
		if (!userId) {
			return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
		}

		const result = await getCachedStudentCoach(userId)

		if (!result.data) {
			return NextResponse.json(result, { status: 404 })
		}

		const response = NextResponse.json(result)
		response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
		return response
	} catch (error) {
		console.error('Error fetching student coach:', error)
		return NextResponse.json(
			{ error: 'Error al cargar la información del coach' },
			{ status: 500 }
		)
	}
}
