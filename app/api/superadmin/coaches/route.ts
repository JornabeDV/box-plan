import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/superadmin/coaches
 * Lista todos los coaches con sus planes, suscripciones y estadísticas
 * Solo accesible para usuarios con rol 'admin'
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

		// Verificar que el usuario es admin
		const userRole = await prisma.userRole.findFirst({
			where: { userId, role: 'admin' }
		})

		if (!userRole) {
			return NextResponse.json(
				{ error: 'No autorizado. Solo administradores pueden acceder.' },
				{ status: 403 }
			)
		}

		const { searchParams } = new URL(request.url)
		const search = searchParams.get('search') || ''
		const planFilter = searchParams.get('plan') || 'all'
		const statusFilter = searchParams.get('status') || 'all'

		// Obtener todos los coaches con sus relaciones
		const coaches = await prisma.coachProfile.findMany({
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
						image: true,
						createdAt: true
					}
				},
				subscriptions: {
					where: {
						status: 'active'
					},
					orderBy: {
						currentPeriodEnd: 'desc'
					},
					take: 1,
					include: {
						plan: {
							select: {
								id: true,
								name: true,
								displayName: true,
								maxStudents: true,
								commissionRate: true,
								features: true
							}
						}
					}
				},
				studentRelationships: {
					where: {
						status: 'active'
					},
					select: {
						id: true,
						studentId: true
					}
				},
				commissions: {
					select: {
						id: true,
						commissionAmount: true,
						status: true
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		})

		// Transformar y filtrar coaches
		const transformedCoaches = coaches
			.map(coach => {
				const activeSubscription = coach.subscriptions[0] || null
				const planInfo = activeSubscription?.plan || null
				const studentCount = coach.studentRelationships.length
				const totalEarnings = coach.commissions
					.filter(c => c.status === 'paid')
					.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

				// Determinar estado del acceso
				let accessStatus = 'inactive'
				if (activeSubscription) {
					const now = new Date()
					if (activeSubscription.currentPeriodEnd > now) {
						accessStatus = 'active'
					} else {
						accessStatus = 'expired'
					}
				} else if (coach.trialEndsAt) {
					const now = new Date()
					const trialEndsAt = coach.trialEndsAt instanceof Date
						? coach.trialEndsAt
						: new Date(coach.trialEndsAt)
					const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
					const trialDate = new Date(trialEndsAt.getFullYear(), trialEndsAt.getMonth(), trialEndsAt.getDate())
					
					if (trialDate >= nowDate) {
						accessStatus = 'trial'
					} else {
						accessStatus = 'expired'
					}
				}

				return {
					id: coach.id,
					userId: coach.userId,
					email: coach.user.email,
					name: coach.user.name,
					image: coach.user.image,
					businessName: coach.businessName,
					phone: coach.phone,
					address: coach.address,
					maxStudents: coach.maxStudents,
					currentStudentCount: studentCount,
					commissionRate: Number(coach.commissionRate),
					totalEarnings: Number(coach.totalEarnings),
					calculatedEarnings: totalEarnings,
					trialEndsAt: coach.trialEndsAt?.toISOString() || null,
					createdAt: coach.createdAt.toISOString(),
					updatedAt: coach.updatedAt.toISOString(),
					plan: planInfo ? {
						id: planInfo.id,
						name: planInfo.name,
						displayName: planInfo.displayName,
						maxStudents: planInfo.maxStudents,
						commissionRate: Number(planInfo.commissionRate),
						features: planInfo.features
					} : null,
					subscription: activeSubscription ? {
						id: activeSubscription.id,
						status: activeSubscription.status,
						currentPeriodStart: activeSubscription.currentPeriodStart.toISOString(),
						currentPeriodEnd: activeSubscription.currentPeriodEnd.toISOString(),
						cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd
					} : null,
					accessStatus,
					studentCount,
					hasMercadoPago: !!coach.mercadopagoAccountId
				}
			})
			.filter(coach => {
				// Filtro de búsqueda
				if (search) {
					const searchLower = search.toLowerCase()
					return (
						coach.email.toLowerCase().includes(searchLower) ||
						coach.name?.toLowerCase().includes(searchLower) ||
						coach.businessName?.toLowerCase().includes(searchLower)
					)
				}
				return true
			})
			.filter(coach => {
				// Filtro de plan
				if (planFilter !== 'all') {
					if (planFilter === 'no_plan') {
						return !coach.plan
					}
					return coach.plan?.name === planFilter
				}
				return true
			})
			.filter(coach => {
				// Filtro de estado
				if (statusFilter !== 'all') {
					return coach.accessStatus === statusFilter
				}
				return true
			})

		// Obtener todos los planes activos para distribución dinámica
		const allPlans = await prisma.coachPlanType.findMany({
			where: {
				isActive: true
			},
			orderBy: {
				basePrice: 'asc'
			},
			select: {
				id: true,
				name: true,
				displayName: true
			}
		})

		// Crear distribución dinámica de planes
		const planDistribution: Record<string, { count: number; displayName: string; name: string }> = {}
		
		// Inicializar con todos los planes activos
		allPlans.forEach(plan => {
			planDistribution[plan.name] = {
				count: 0,
				displayName: plan.displayName,
				name: plan.name
			}
		})

		// Contar coaches por plan
		transformedCoaches.forEach(coach => {
			if (coach.plan) {
				const planName = coach.plan.name
				if (planDistribution[planName]) {
					planDistribution[planName].count++
				} else {
					// Si el plan no está en la lista de planes activos, agregarlo
					planDistribution[planName] = {
						count: 1,
						displayName: coach.plan.displayName,
						name: planName
					}
				}
			}
		})

		// Agregar contador de coaches sin plan
		const noPlanCount = transformedCoaches.filter(c => !c.plan).length
		if (noPlanCount > 0) {
			planDistribution['no_plan'] = {
				count: noPlanCount,
				displayName: 'Sin Plan',
				name: 'no_plan'
			}
		}

		// Estadísticas generales
		const stats = {
			totalCoaches: coaches.length,
			activeCoaches: transformedCoaches.filter(c => c.accessStatus === 'active').length,
			trialCoaches: transformedCoaches.filter(c => c.accessStatus === 'trial').length,
			expiredCoaches: transformedCoaches.filter(c => c.accessStatus === 'expired').length,
			totalStudents: transformedCoaches.reduce((sum, c) => sum + c.studentCount, 0),
			totalEarnings: transformedCoaches.reduce((sum, c) => sum + c.calculatedEarnings, 0),
			planDistribution
		}

		return NextResponse.json({
			coaches: transformedCoaches,
			stats
		})
	} catch (error) {
		console.error('Error fetching coaches:', error)
		return NextResponse.json(
			{ error: 'Error al obtener coaches' },
			{ status: 500 }
		)
	}
}
