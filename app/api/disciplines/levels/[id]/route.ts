import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

// PATCH /api/disciplines/levels/[id]
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

		// Verificar que el usuario es coach
		const authCheck = await isCoach(userId)
		if (!authCheck.isAuthorized) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
		}

		const levelId = parseInt(params.id)

		if (isNaN(levelId)) {
			return NextResponse.json(
				{ error: 'Invalid level ID' },
				{ status: 400 }
			)
		}

		const body = await request.json()
		const { name, description, order_index, is_active } = body

		// Verificar que el nivel existe y pertenece al coach
		const existingLevel = await prisma.disciplineLevel.findFirst({
			where: {
				id: levelId,
				discipline: {
					coachId: (authCheck.profile as any).id
				}
			},
			select: { id: true, disciplineId: true }
		})

		if (!existingLevel) {
			return NextResponse.json(
				{ error: 'Nivel no encontrado' },
				{ status: 404 }
			)
		}

		// Preparar datos de actualización
		const updateData: any = {}
		if (name !== undefined) updateData.name = name.trim()
		if (description !== undefined) updateData.description = description?.trim() || null
		if (order_index !== undefined) updateData.orderIndex = order_index
		if (is_active !== undefined) updateData.isActive = is_active

		// Actualizar el nivel
		const updatedLevel = await prisma.disciplineLevel.update({
			where: { id: levelId },
			data: updateData
		})

		// Transformar al formato esperado por el frontend
		const transformedLevel = {
			id: String(updatedLevel.id),
			discipline_id: String(updatedLevel.disciplineId),
			name: updatedLevel.name,
			description: updatedLevel.description || undefined,
			order_index: updatedLevel.orderIndex,
			is_active: updatedLevel.isActive,
			created_at: updatedLevel.createdAt.toISOString(),
			updated_at: updatedLevel.updatedAt.toISOString()
		}

		return NextResponse.json(transformedLevel)
	} catch (error) {
		console.error('Error updating discipline level:', error)
		return NextResponse.json(
			{ error: 'Error al actualizar nivel' },
			{ status: 500 }
		)
	}
}

// DELETE /api/disciplines/levels/[id]
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const levelId = parseInt(params.id)

		if (isNaN(levelId)) {
			return NextResponse.json(
				{ error: 'Invalid level ID' },
				{ status: 400 }
			)
		}

		// Verificar que el nivel existe
		const existingLevel = await prisma.disciplineLevel.findUnique({
			where: { id: levelId },
			select: { id: true, disciplineId: true }
		})

		if (!existingLevel) {
			return NextResponse.json(
				{ error: 'Nivel no encontrado' },
				{ status: 404 }
			)
		}

		// Hard delete: eliminar físicamente de la base de datos
		// Primero actualizamos las planificaciones que usan este nivel para que disciplineLevelId sea null
		await prisma.$transaction([
			// Actualizar planificaciones que referencian este nivel
			prisma.planification.updateMany({
				where: { disciplineLevelId: levelId },
				data: { disciplineLevelId: null }
			}),
			// Eliminar el nivel físicamente
			prisma.disciplineLevel.delete({
				where: { id: levelId }
			})
		])

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting discipline level:', error)
		return NextResponse.json(
			{ error: 'Error al eliminar nivel' },
			{ status: 500 }
		)
	}
}