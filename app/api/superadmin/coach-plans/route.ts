import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/superadmin/coach-plans
 * Lista todos los planes de coaches (solo superadmin)
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

		const plans = await prisma.coachPlanType.findMany({
			orderBy: {
				basePrice: 'asc'
			}
		})

		const transformedPlans = plans.map(plan => ({
			id: plan.id,
			name: plan.name,
			displayName: plan.displayName,
			minStudents: plan.minStudents,
			maxStudents: plan.maxStudents,
			basePrice: Number(plan.basePrice),
			commissionRate: Number(plan.commissionRate),
			features: plan.features,
			isActive: plan.isActive,
			createdAt: plan.createdAt.toISOString(),
			updatedAt: plan.updatedAt.toISOString()
		}))

		return NextResponse.json({
			plans: transformedPlans
		})
	} catch (error) {
		console.error('Error fetching coach plans:', error)
		return NextResponse.json(
			{ error: 'Error al obtener los planes' },
			{ status: 500 }
		)
	}
}
