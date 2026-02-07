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
			maxStudentPlans: plan.maxStudentPlans,
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

/**
 * POST /api/superadmin/coach-plans
 * Crea un nuevo plan de coach (solo superadmin)
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

		const body = await request.json()
		const {
			name,
			displayName,
			minStudents,
			maxStudents,
			basePrice,
			commissionRate,
			maxStudentPlans,
			features,
			isActive
		} = body

		// Validaciones básicas
		if (!name || !displayName) {
			return NextResponse.json(
				{ error: 'El nombre y displayName son requeridos' },
				{ status: 400 }
			)
		}

		// Verificar que no exista un plan con el mismo nombre
		const existingPlan = await prisma.coachPlanType.findUnique({
			where: { name }
		})

		if (existingPlan) {
			return NextResponse.json(
				{ error: 'Ya existe un plan con ese nombre' },
				{ status: 400 }
			)
		}

		// Crear el plan
		const newPlan = await prisma.coachPlanType.create({
			data: {
				name,
				displayName,
				minStudents: minStudents ?? 0,
				maxStudents: maxStudents ?? 999999,
				basePrice: basePrice ?? 0,
				commissionRate: commissionRate ?? 0,
				maxStudentPlans: maxStudentPlans ?? 2,
				features: features ?? {},
				isActive: isActive ?? true
			}
		})

		return NextResponse.json({
			success: true,
			plan: {
				id: newPlan.id,
				name: newPlan.name,
				displayName: newPlan.displayName,
				minStudents: newPlan.minStudents,
				maxStudents: newPlan.maxStudents,
				basePrice: Number(newPlan.basePrice),
				commissionRate: Number(newPlan.commissionRate),
				maxStudentPlans: newPlan.maxStudentPlans,
				features: newPlan.features,
				isActive: newPlan.isActive,
				createdAt: newPlan.createdAt.toISOString(),
				updatedAt: newPlan.updatedAt.toISOString()
			}
		}, { status: 201 })
	} catch (error) {
		console.error('Error creating coach plan:', error)
		return NextResponse.json(
			{ error: 'Error al crear el plan' },
			{ status: 500 }
		)
	}
}
