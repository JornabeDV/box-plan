import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

/**
 * POST /api/coaches/subscribe
 * Crea una suscripción para un coach (trial gratuita)
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
		const { planId } = body

		if (!planId) {
			return NextResponse.json(
				{ error: 'planId es requerido' },
				{ status: 400 }
			)
		}

		const planIdNum = typeof planId === 'string' ? parseInt(planId, 10) : planId

		if (isNaN(planIdNum)) {
			return NextResponse.json(
				{ error: 'planId debe ser un número válido' },
				{ status: 400 }
			)
		}

		// Verificar que el usuario sea coach
		const authCheck = await isCoach(userId)
		if (!authCheck.isAuthorized || !authCheck.profile) {
			return NextResponse.json(
				{ error: 'Solo los coaches pueden suscribirse a planes' },
				{ status: 403 }
			)
		}

		const coachId = authCheck.profile.id

		// Verificar que el plan existe
		const plan = await prisma.coachPlanType.findUnique({
			where: { id: planIdNum }
		})

		if (!plan) {
			return NextResponse.json(
				{ error: 'Plan no encontrado' },
				{ status: 404 }
			)
		}

		// Verificar si el coach ya tiene una suscripción activa
		const existingSubscription = await prisma.coachSubscription.findFirst({
			where: {
				coachId: coachId,
				status: 'active',
				currentPeriodEnd: {
					gte: new Date()
				}
			}
		})

		if (existingSubscription) {
			return NextResponse.json(
				{ error: 'Ya tienes una suscripción activa' },
				{ status: 400 }
			)
		}

		// Calcular fechas del período de prueba (30 días)s
		const currentPeriodStart = new Date()
		const currentPeriodEnd = new Date()
		currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

		// Crear la suscripción en una transacción
		const result = await prisma.$transaction(async (tx) => {
			// Crear la suscripción
			const subscription = await tx.coachSubscription.create({
				data: {
					coachId: coachId,
					planId: planIdNum,
					status: 'trial',
					currentPeriodStart,
					currentPeriodEnd,
					cancelAtPeriodEnd: false
				}
			})

			// Actualizar el trialEndsAt del coach
			await tx.coachProfile.update({
				where: { id: coachId },
				data: {
					trialEndsAt: currentPeriodEnd,
					maxStudents: plan.maxStudents,
					commissionRate: plan.commissionRate
				}
			})

			return subscription
		})

		return NextResponse.json({
			success: true,
			subscription: {
				id: result.id,
				planId: result.planId,
				status: result.status,
				currentPeriodStart: result.currentPeriodStart.toISOString(),
				currentPeriodEnd: result.currentPeriodEnd.toISOString()
			},
			message: 'Suscripción creada exitosamente. Tienes 30 días de prueba gratuita.'
		})
	} catch (error) {
		console.error('Error creating coach subscription:', error)
		return NextResponse.json(
			{ error: 'Error al crear la suscripción' },
			{ status: 500 }
		)
	}
}
