import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/superadmin/coach-plans/[id]
 * Actualiza un plan de coach (solo superadmin)
 */
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
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

		const planId = parseInt(params.id, 10)
		if (isNaN(planId)) {
			return NextResponse.json(
				{ error: 'ID de plan inválido' },
				{ status: 400 }
			)
		}

		const body = await request.json()
		const {
			displayName,
			minStudents,
			maxStudents,
			basePrice,
			commissionRate,
			maxStudentPlans,
			features,
			isActive
		} = body

		// Verificar que el plan existe
		const existingPlan = await prisma.coachPlanType.findUnique({
			where: { id: planId }
		})

		if (!existingPlan) {
			return NextResponse.json(
				{ error: 'Plan no encontrado' },
				{ status: 404 }
			)
		}

		// Preparar datos de actualización
		const updateData: any = {}
		if (displayName !== undefined) updateData.displayName = displayName
		if (minStudents !== undefined) updateData.minStudents = minStudents
		if (maxStudents !== undefined) updateData.maxStudents = maxStudents
		if (basePrice !== undefined) updateData.basePrice = basePrice
		if (commissionRate !== undefined) updateData.commissionRate = commissionRate
		if (maxStudentPlans !== undefined) updateData.maxStudentPlans = maxStudentPlans
		if (features !== undefined) updateData.features = features
		if (isActive !== undefined) updateData.isActive = isActive

		// Actualizar plan
		const updatedPlan = await prisma.coachPlanType.update({
			where: { id: planId },
			data: updateData
		})

		return NextResponse.json({
			success: true,
			plan: {
				id: updatedPlan.id,
				name: updatedPlan.name,
				displayName: updatedPlan.displayName,
				minStudents: updatedPlan.minStudents,
				maxStudents: updatedPlan.maxStudents,
				basePrice: Number(updatedPlan.basePrice),
				commissionRate: Number(updatedPlan.commissionRate),
				maxStudentPlans: updatedPlan.maxStudentPlans,
				features: updatedPlan.features,
				isActive: updatedPlan.isActive
			}
		})
	} catch (error) {
		console.error('Error updating coach plan:', error)
		return NextResponse.json(
			{ error: 'Error al actualizar el plan' },
			{ status: 500 }
		)
	}
}
