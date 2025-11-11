import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/disciplines/[id]
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const disciplineId = parseInt(params.id)
		const body = await request.json()
		const { name, description, color, order_index, levels } = body

		// Verificar que la disciplina existe
		const existing = await prisma.discipline.findFirst({
			where: {
				id: disciplineId,
				isActive: true
			},
			select: { id: true, coachId: true }
		})

		if (!existing) {
			return NextResponse.json(
				{ error: 'Disciplina no encontrada' },
				{ status: 404 }
			)
		}

		// Preparar datos de actualización
		const updateData: any = {}
		if (name !== undefined) updateData.name = name
		if (description !== undefined) updateData.description = description || null
		if (color !== undefined) updateData.color = color
		if (order_index !== undefined) updateData.orderIndex = order_index

		// Manejar niveles si se proporcionan
		if (levels !== undefined) {
			// Obtener niveles existentes
			const existingLevels = await prisma.disciplineLevel.findMany({
				where: {
					disciplineId,
					isActive: true
				},
				select: { id: true },
				orderBy: { orderIndex: 'asc' }
			})

			const existingLevelIds = new Set(existingLevels.map(l => l.id))
			const newLevelIds = new Set(
				(levels as any[])
					.filter((l: any) => l.id)
					.map((l: any) => l.id)
			)

			// Eliminar niveles que ya no están en la lista (soft delete)
			const levelsToDelete = Array.from(existingLevelIds).filter(
				(id) => !newLevelIds.has(id)
			)

			if (levelsToDelete.length > 0) {
				await prisma.disciplineLevel.updateMany({
					where: {
						id: { in: levelsToDelete }
					},
					data: {
						isActive: false
					}
				})
			}

			// Preparar operaciones de niveles
			const levelOperations: any[] = []

			for (const level of levels) {
				if (level.id && newLevelIds.has(level.id)) {
					// Actualizar nivel existente
					levelOperations.push(
						prisma.disciplineLevel.update({
							where: { id: level.id },
							data: {
								name: level.name,
								description: level.description || null,
								orderIndex: level.order_index || 0,
								isActive: level.is_active !== undefined ? level.is_active : true
							}
						})
					)
				} else if (!level.id) {
					// Crear nuevo nivel
					levelOperations.push(
						prisma.disciplineLevel.create({
							data: {
								disciplineId,
								name: level.name,
								description: level.description || null,
								orderIndex: level.order_index || 0,
								isActive: level.is_active !== undefined ? level.is_active : true
							}
						})
					)
				}
			}

			// Ejecutar operaciones de niveles
			if (levelOperations.length > 0) {
				await Promise.all(levelOperations)
			}
		}

		// Actualizar disciplina si hay cambios
		if (Object.keys(updateData).length > 0) {
			await prisma.discipline.update({
				where: { id: disciplineId },
				data: updateData
			})
		}

		// Obtener disciplina actualizada con sus niveles
		const result = await prisma.discipline.findUnique({
			where: { id: disciplineId },
			include: {
				levels: {
					where: { isActive: true },
					orderBy: { orderIndex: 'asc' }
				}
			}
		})

		return NextResponse.json(result)
	} catch (error) {
		console.error('Error updating discipline:', error)
		const errorMessage = error instanceof Error ? error.message : 'Error al actualizar disciplina'
		return NextResponse.json(
			{ error: errorMessage },
			{ status: 500 }
		)
	}
}

// DELETE /api/disciplines/[id]
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const disciplineId = parseInt(params.id)

		// Soft delete: marcar como inactivo
		await prisma.$transaction([
			prisma.discipline.update({
				where: { id: disciplineId },
				data: { isActive: false }
			}),
			prisma.disciplineLevel.updateMany({
				where: { disciplineId },
				data: { isActive: false }
			})
		])

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting discipline:', error)
		return NextResponse.json(
			{ error: 'Error al eliminar disciplina' },
			{ status: 500 }
		)
	}
}