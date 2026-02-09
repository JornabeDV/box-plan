import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/student/coach
// Obtiene la información del coach asignado al estudiante
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		
		const userId = normalizeUserId(session?.user?.id)
		if (!userId) {
			return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
		}

		// Obtener el coach del estudiante
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
			return NextResponse.json({ 
				data: null,
				message: 'El usuario no está asociado a ningún coach activo'
			}, { status: 404 })
		}

		const coachProfile = relationship.coach

		return NextResponse.json({ 
			data: {
				id: coachProfile.id,
				businessName: coachProfile.businessName,
				phone: coachProfile.phone,
				email: coachProfile.user.email
			}
		})
	} catch (error) {
		console.error('Error fetching student coach:', error)
		return NextResponse.json(
			{ error: 'Error al cargar la información del coach' },
			{ status: 500 }
		)
	}
}
