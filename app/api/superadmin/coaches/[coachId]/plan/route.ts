import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/superadmin/coaches/[coachId]/plan
 * Cambia el plan de un coach (solo superadmin)
 */
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { coachId: string } }
) {
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
				{ error: 'No autorizado. Solo administradores pueden realizar esta acción.' },
				{ status: 403 }
			)
		}

		const coachId = parseInt(params.coachId, 10)
		if (isNaN(coachId)) {
			return NextResponse.json(
				{ error: 'ID de coach inválido' },
				{ status: 400 }
			)
		}

		const body = await request.json()
		const { planId, startDate, endDate } = body

		if (!planId) {
			return NextResponse.json(
				{ error: 'ID de plan requerido' },
				{ status: 400 }
			)
		}

		// Verificar que el plan existe
		const plan = await prisma.coachPlanType.findUnique({
			where: { id: parseInt(planId, 10) }
		})

		if (!plan) {
			return NextResponse.json(
				{ error: 'Plan no encontrado' },
				{ status: 404 }
			)
		}

		// Verificar que el coach existe
		const coach = await prisma.coachProfile.findUnique({
			where: { id: coachId }
		})

		if (!coach) {
			return NextResponse.json(
				{ error: 'Coach no encontrado' },
				{ status: 404 }
			)
		}

		// Cancelar suscripciones activas anteriores
		await prisma.coachSubscription.updateMany({
			where: {
				coachId,
				status: 'active'
			},
			data: {
				status: 'canceled',
				cancelAtPeriodEnd: false
			}
		})

		// Crear nueva suscripción
		const periodStart = startDate ? new Date(startDate) : new Date()
		const periodEnd = endDate 
			? new Date(endDate)
			: (() => {
				const end = new Date(periodStart)
				end.setMonth(end.getMonth() + 1) // 1 mes por defecto
				return end
			})()

		const newSubscription = await prisma.coachSubscription.create({
			data: {
				coachId,
				planId: plan.id,
				status: 'active',
				currentPeriodStart: periodStart,
				currentPeriodEnd: periodEnd,
				cancelAtPeriodEnd: false
			},
			include: {
				plan: true
			}
		})

		// Actualizar maxStudents del coach según el plan
		await prisma.coachProfile.update({
			where: { id: coachId },
			data: {
				maxStudents: plan.maxStudents
			}
		})

		return NextResponse.json({
			success: true,
			subscription: {
				id: newSubscription.id,
				plan: {
					id: newSubscription.plan.id,
					name: newSubscription.plan.name,
					displayName: newSubscription.plan.displayName
				},
				currentPeriodStart: newSubscription.currentPeriodStart.toISOString(),
				currentPeriodEnd: newSubscription.currentPeriodEnd.toISOString()
			}
		})
	} catch (error) {
		console.error('Error updating coach plan:', error)
		return NextResponse.json(
			{ error: 'Error al actualizar plan del coach' },
			{ status: 500 }
		)
	}
}

