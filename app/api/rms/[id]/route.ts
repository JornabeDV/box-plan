import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { studentHasFeature } from '@/lib/coach-plan-features'

// PATCH /api/rms/[id]
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)
		
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const rmId = parseInt(params.id, 10)
		if (isNaN(rmId)) {
			return NextResponse.json({ error: 'Invalid RM ID' }, { status: 400 })
		}

		// Verificar que el RM pertenece al usuario
		const existingRM = await prisma.rMRecord.findUnique({
			where: { id: rmId }
		})

		if (!existingRM) {
			return NextResponse.json({ error: 'RM record not found' }, { status: 404 })
		}

		if (existingRM.userId !== userId) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		// Verificar si el usuario tiene acceso a la carga de scores según el plan del coach
		try {
			const hasAccess = await studentHasFeature(userId, 'score_loading')
			if (!hasAccess) {
				return NextResponse.json(
					{ error: 'Tu plan no incluye la funcionalidad de carga de Repeticiones Máximas (RM). Actualiza tu plan para acceder a esta funcionalidad.' },
					{ status: 403 }
				)
			}
		} catch (planError) {
			// Si hay error al obtener el plan, loguear pero continuar con la actualización
			console.error('Error al validar acceso a carga de RM:', planError)
		}

		const body = await request.json()
		const { exercise, weight, recorded_at } = body

		const updateData: any = {}
		if (exercise !== undefined) updateData.exercise = exercise.trim()
		if (weight !== undefined) {
			const weightDecimal = typeof weight === 'string' ? parseFloat(weight) : weight
			if (isNaN(weightDecimal) || weightDecimal <= 0) {
				return NextResponse.json(
					{ error: 'Weight must be a positive number' },
					{ status: 400 }
				)
			}
			updateData.weight = weightDecimal
		}
		if (recorded_at !== undefined) updateData.recordedAt = new Date(recorded_at)

		const result = await prisma.rMRecord.update({
			where: { id: rmId },
			data: updateData
		})

		return NextResponse.json(result)
	} catch (error) {
		console.error('Error updating RM record:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// DELETE /api/rms/[id]
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)
		
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const rmId = parseInt(params.id, 10)
		if (isNaN(rmId)) {
			return NextResponse.json({ error: 'Invalid RM ID' }, { status: 400 })
		}

		// Verificar que el RM pertenece al usuario
		const existingRM = await prisma.rMRecord.findUnique({
			where: { id: rmId }
		})

		if (!existingRM) {
			return NextResponse.json({ error: 'RM record not found' }, { status: 404 })
		}

		if (existingRM.userId !== userId) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		await prisma.rMRecord.delete({
			where: { id: rmId }
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting RM record:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}