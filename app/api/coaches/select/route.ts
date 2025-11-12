import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

// Forzar modo dinámico para evitar errores en build time
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/coaches/select
 * Asigna un coach a un usuario (estudiante)
 * Requiere autenticación
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		if (!userId) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		const body = await request.json()
		const { coachId } = body

		if (!coachId || typeof coachId !== 'number') {
			return NextResponse.json(
				{ error: 'coachId es requerido y debe ser un número' },
				{ status: 400 }
			)
		}

		// Verificar que el usuario no es coach
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				roles: true,
				coachProfile: true
			}
		})

		if (!user) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			)
		}

		// Verificar que el usuario no es coach
		const isCoach = user.roles.some(r => r.role === 'coach')
		if (isCoach) {
			return NextResponse.json(
				{ error: 'Los coaches no pueden seleccionar otro coach' },
				{ status: 400 }
			)
		}

		// Verificar que el coach existe y tiene capacidad
		const coach = await prisma.coachProfile.findUnique({
			where: { id: coachId },
			include: {
				studentRelationships: {
					where: {
						status: 'active'
					}
				},
				subscriptions: {
					where: {
						status: 'active',
						currentPeriodEnd: {
							gte: new Date()
						}
					}
				}
			}
		})

		if (!coach) {
			return NextResponse.json(
				{ error: 'Coach no encontrado' },
				{ status: 404 }
			)
		}

		// Verificar que el coach tiene suscripción activa o período de prueba
		const hasActiveSubscription = coach.subscriptions.length > 0 || 
			(coach.trialEndsAt !== null && coach.trialEndsAt >= new Date())

		if (!hasActiveSubscription) {
			return NextResponse.json(
				{ error: 'El coach no tiene suscripción activa' },
				{ status: 400 }
			)
		}

		// Verificar capacidad
		const activeStudentsCount = coach.studentRelationships.length
		if (activeStudentsCount >= coach.maxStudents) {
			return NextResponse.json(
				{ 
					error: 'El coach ha alcanzado su capacidad máxima de estudiantes',
					maxStudents: coach.maxStudents,
					currentStudents: activeStudentsCount
				},
				{ status: 400 }
			)
		}

		// Verificar si ya existe una relación (activa o inactiva)
		const existingRelationship = await prisma.coachStudentRelationship.findUnique({
			where: {
				coachId_studentId: {
					coachId: coachId,
					studentId: userId
				}
			}
		})

		if (existingRelationship) {
			if (existingRelationship.status === 'active') {
				return NextResponse.json(
					{ error: 'Ya estás asignado a este coach' },
					{ status: 400 }
				)
			} else {
				// Reactivar relación existente
				await prisma.coachStudentRelationship.update({
					where: { id: existingRelationship.id },
					data: {
						status: 'active',
						joinedAt: new Date(),
						removedAt: null
					}
				})

				// Actualizar contador del coach
				await prisma.coachProfile.update({
					where: { id: coachId },
					data: {
						currentStudentCount: {
							increment: 1
						}
					}
				})

				return NextResponse.json({
					success: true,
					message: 'Coach asignado exitosamente',
					relationship: {
						coachId,
						studentId: userId,
						status: 'active'
					}
				})
			}
		}

		// Crear nueva relación
		await prisma.$transaction([
			// Crear relación
			prisma.coachStudentRelationship.create({
				data: {
					coachId,
					studentId: userId,
					status: 'active'
				}
			}),
			// Actualizar contador del coach
			prisma.coachProfile.update({
				where: { id: coachId },
				data: {
					currentStudentCount: {
						increment: 1
					}
				}
			})
		])

		return NextResponse.json({
			success: true,
			message: 'Coach asignado exitosamente',
			relationship: {
				coachId,
				studentId: userId,
				status: 'active'
			}
		})
	} catch (error) {
		console.error('Error selecting coach:', error)
		return NextResponse.json(
			{ error: 'Error al asignar el coach' },
			{ status: 500 }
		)
	}
}