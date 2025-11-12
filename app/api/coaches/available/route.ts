import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Forzar modo dinámico para evitar errores en build time
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/coaches/available
 * Lista todos los coaches disponibles con capacidad para aceptar nuevos estudiantes
 */
export async function GET(request: NextRequest) {
	try {
		// Obtener todos los coaches con sus perfiles y contar estudiantes activos
		const coaches = await prisma.coachProfile.findMany({
			where: {
				// Solo coaches con suscripción activa o período de prueba válido
				OR: [
					{
						subscriptions: {
							some: {
								status: 'active',
								currentPeriodEnd: {
									gte: new Date()
								}
							}
						}
					},
					{
						trialEndsAt: {
							gte: new Date()
						}
					}
				]
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true
					}
				},
				studentRelationships: {
					where: {
						status: 'active'
					},
					select: {
						id: true
					}
				},
				subscriptions: {
					where: {
						status: 'active',
						currentPeriodEnd: {
							gte: new Date()
						}
					},
					select: {
						id: true,
						status: true
					}
				}
			}
		})

		// Filtrar y formatear coaches con capacidad disponible
		const availableCoaches = coaches
			.map(coach => {
				const activeStudentsCount = coach.studentRelationships.length
				const hasCapacity = activeStudentsCount < coach.maxStudents
				const availableSlots = coach.maxStudents - activeStudentsCount

				return {
					id: coach.id,
					userId: coach.userId,
					name: coach.user.name,
					email: coach.user.email,
					image: coach.user.image,
					businessName: coach.businessName,
					phone: coach.phone,
					address: coach.address,
					maxStudents: coach.maxStudents,
					currentStudentCount: activeStudentsCount,
					availableSlots,
					hasCapacity,
					hasActiveSubscription: coach.subscriptions.length > 0 || coach.trialEndsAt !== null
				}
			})
			.filter(coach => coach.hasCapacity) // Solo coaches con capacidad disponible
			.sort((a, b) => {
				// Ordenar por: primero los que tienen más slots disponibles, luego por nombre
				if (a.availableSlots !== b.availableSlots) {
					return b.availableSlots - a.availableSlots
				}
				return (a.name || '').localeCompare(b.name || '')
			})

		return NextResponse.json({
			success: true,
			coaches: availableCoaches,
			total: availableCoaches.length
		})
	} catch (error) {
		console.error('Error fetching available coaches:', error)
		return NextResponse.json(
			{ error: 'Error al obtener los coaches disponibles' },
			{ status: 500 }
		)
	}
}
