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
		if (levels !== undefined && Array.isArray(levels)) {
			// Obtener niveles existentes
			const existingLevels = await prisma.disciplineLevel.findMany({
				where: {
					disciplineId,
					isActive: true
				},
				select: { id: true },
				orderBy: { orderIndex: 'asc' }
			})

			const existingLevelIds = new Set(existingLevels.map(l => l.id).filter((id): id is number => id !== null && id !== undefined))
			const newLevelIds = new Set(
				(levels as any[])
					.filter((l: any) => l.id !== undefined && l.id !== null && l.id !== '')
					.map((l: any) => {
						const id = typeof l.id === 'string' ? parseInt(l.id, 10) : l.id
						return isNaN(id) ? null : id
					})
					.filter((id): id is number => id !== null)
			)

			// Eliminar niveles que ya no están en la lista (hard delete)
			const levelsToDelete = Array.from(existingLevelIds).filter(
				(id) => !newLevelIds.has(id)
			)

			if (levelsToDelete.length > 0) {
				// Verificar si hay usuarios con preferencias vinculadas a estos niveles
				const usersWithLevelPreference = await prisma.userPreference.findMany({
					where: {
						preferredLevelId: { in: levelsToDelete }
					},
					select: {
						userId: true,
						preferredLevelId: true
					}
				})

				// Si hay usuarios vinculados, no permitir la eliminación
				if (usersWithLevelPreference.length > 0) {
					const affectedLevelIds = [...new Set(usersWithLevelPreference.map(u => u.preferredLevelId))].filter((id): id is number => id !== null && id !== undefined)
					const affectedLevels = await prisma.disciplineLevel.findMany({
						where: {
							id: { in: affectedLevelIds }
						},
						select: {
							id: true,
							name: true
						}
					})

					const levelNames = affectedLevels.map(l => l.name).join(', ')
					const totalUsers = new Set(usersWithLevelPreference.map(u => u.userId)).size

					return NextResponse.json(
						{
							error: `No se pueden eliminar los niveles "${levelNames}" porque ${totalUsers} usuario${totalUsers !== 1 ? 's' : ''} tiene${totalUsers !== 1 ? 'n' : ''} estos niveles como preferencia. Por favor, actualiza las preferencias de los usuarios antes de eliminar.`
						},
						{ status: 400 }
					)
				}

				// Primero actualizar planificaciones que referencian estos niveles
				await prisma.planification.updateMany({
					where: {
						disciplineLevelId: { in: levelsToDelete }
					},
					data: {
						disciplineLevelId: null
					}
				})
				// Luego eliminar los niveles físicamente
				await prisma.disciplineLevel.deleteMany({
					where: {
						id: { in: levelsToDelete }
					}
				})
			}

			// Preparar operaciones de niveles
			const levelOperations: any[] = []

			for (const level of levels) {
				// Validar que el nivel tenga nombre (requerido)
				if (!level.name || typeof level.name !== 'string' || level.name.trim() === '') {
					continue
				}

				// Verificar si el nivel tiene un ID válido
				const hasValidId = level.id !== undefined && level.id !== null && level.id !== ''
				const levelId = hasValidId 
					? (typeof level.id === 'string' ? parseInt(level.id, 10) : level.id)
					: null

				if (hasValidId && levelId && !isNaN(levelId) && existingLevelIds.has(levelId)) {
					// Actualizar nivel existente
					levelOperations.push(
						prisma.disciplineLevel.update({
							where: { id: levelId },
							data: {
								name: level.name.trim(),
								description: level.description?.trim() || null,
								orderIndex: level.order_index ?? 0,
								isActive: level.is_active !== undefined ? level.is_active : true
							}
						})
					)
				} else {
					// Crear nuevo nivel (no tiene ID o el ID no es válido o no existe)
					levelOperations.push(
						prisma.disciplineLevel.create({
							data: {
								disciplineId,
								name: level.name.trim(),
								description: level.description?.trim() || null,
								orderIndex: level.order_index ?? 0,
								isActive: level.is_active !== undefined ? level.is_active : true
							}
						})
					)
				}
			}

			// Ejecutar operaciones de niveles en una transacción para asegurar consistencia
			if (levelOperations.length > 0) {
				await prisma.$transaction(levelOperations)
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

		if (!result) {
			return NextResponse.json(
				{ error: 'Disciplina no encontrada' },
				{ status: 404 }
			)
		}

		// Transformar al formato esperado por el frontend
		const transformedDiscipline = {
			id: String(result.id),
			name: result.name,
			description: result.description || undefined,
			color: result.color,
			order_index: result.orderIndex,
			is_active: result.isActive,
			coach_id: String(result.coachId),
			created_at: result.createdAt.toISOString(),
			updated_at: result.updatedAt.toISOString(),
			levels: result.levels.map(level => ({
				id: String(level.id),
				discipline_id: String(level.disciplineId),
				name: level.name,
				description: level.description || undefined,
				order_index: level.orderIndex,
				is_active: level.isActive,
				created_at: level.createdAt.toISOString(),
				updated_at: level.updatedAt.toISOString()
			}))
		}

		return NextResponse.json(transformedDiscipline)
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

		// Verificar si hay usuarios con preferencias vinculadas a esta disciplina
		const usersWithDisciplinePreference = await prisma.userPreference.findMany({
			where: {
				preferredDisciplineId: disciplineId
			},
			select: {
				userId: true
			}
		})

		// Obtener los IDs de los niveles de esta disciplina
		const levels = await prisma.disciplineLevel.findMany({
			where: { disciplineId },
			select: { id: true }
		})
		const levelIds = levels.map(l => l.id).filter((id): id is number => id !== null && id !== undefined)

		// Verificar si hay usuarios con preferencias vinculadas a los niveles de esta disciplina
		const usersWithLevelPreference = levelIds.length > 0
			? await prisma.userPreference.findMany({
					where: {
						preferredLevelId: { in: levelIds }
					},
					select: {
						userId: true
					}
				})
			: []

		// Si hay usuarios vinculados, no permitir la eliminación
		if (usersWithDisciplinePreference.length > 0 || usersWithLevelPreference.length > 0) {
			const totalUsers = new Set([
				...usersWithDisciplinePreference.map(u => u.userId),
				...usersWithLevelPreference.map(u => u.userId)
			]).size

			return NextResponse.json(
				{
					error: `No se puede eliminar esta disciplina porque ${totalUsers} usuario${totalUsers !== 1 ? 's' : ''} tiene${totalUsers !== 1 ? 'n' : ''} esta disciplina o sus niveles como preferencia. Por favor, actualiza las preferencias de los usuarios antes de eliminar.`
				},
				{ status: 400 }
			)
		}

		// Hard delete: eliminar físicamente de la base de datos
		await prisma.$transaction(async (tx) => {
			// Actualizar planificaciones que referencian estos niveles
			if (levelIds.length > 0) {
				await tx.planification.updateMany({
					where: {
						disciplineLevelId: { in: levelIds }
					},
					data: {
						disciplineLevelId: null
					}
				})
			}
			// Actualizar planificaciones que referencian la disciplina
			await tx.planification.updateMany({
				where: { disciplineId },
				data: {
					disciplineId: null
				}
			})
			// Eliminar los niveles físicamente
			await tx.disciplineLevel.deleteMany({
				where: { disciplineId }
			})
			// Eliminar la disciplina físicamente
			await tx.discipline.delete({
				where: { id: disciplineId }
			})
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting discipline:', error)
		return NextResponse.json(
			{ error: 'Error al eliminar disciplina' },
			{ status: 500 }
		)
	}
}