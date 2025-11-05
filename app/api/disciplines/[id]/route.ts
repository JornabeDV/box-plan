import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

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

		const { id } = params
		const body = await request.json()
		const { name, description, color, order_index, levels } = body

		// Verificar que la disciplina existe
		const existing = await sql`
			SELECT id, admin_id FROM disciplines WHERE id = ${id} AND is_active = true
		`

		if (!existing || existing.length === 0) {
			return NextResponse.json(
				{ error: 'Disciplina no encontrada' },
				{ status: 404 }
			)
		}

		// Actualizar disciplina
		const conditions: string[] = []

		if (name !== undefined) {
			conditions.push(`name = '${name.replace(/'/g, "''")}'`)
		}
		if (description !== undefined) {
			conditions.push(`description = ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'}`)
		}
		if (color !== undefined) {
			conditions.push(`color = '${color.replace(/'/g, "''")}'`)
		}
		if (order_index !== undefined) {
			conditions.push(`order_index = ${order_index}`)
		}

		if (conditions.length > 0) {
			conditions.push('updated_at = NOW()')
			const setClause = conditions.join(', ')

			await sql.unsafe(`UPDATE disciplines SET ${setClause} WHERE id = '${id}'`)
		}

		// Manejar niveles si se proporcionan
		if (levels !== undefined) {
			// Obtener niveles existentes
			const existingLevels = await sql`
				SELECT id, name, order_index FROM discipline_levels 
				WHERE discipline_id = ${id} AND is_active = true
				ORDER BY order_index ASC
			`

			const existingLevelIds = new Set(
				(existingLevels as any[]).map((l: any) => l.id)
			)
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
				await sql`
					UPDATE discipline_levels 
					SET is_active = false, updated_at = NOW()
					WHERE id = ANY(${levelsToDelete}::uuid[])
				`
			}

			// Crear o actualizar niveles
			for (const level of levels) {
				if (level.id && newLevelIds.has(level.id)) {
					// Actualizar nivel existente
					await sql`
						UPDATE discipline_levels
						SET 
							name = ${level.name},
							description = ${level.description || null},
							order_index = ${level.order_index || 0},
							is_active = ${level.is_active !== undefined ? level.is_active : true},
							updated_at = NOW()
						WHERE id = ${level.id}
					`
				} else if (!level.id) {
					// Crear nuevo nivel
					await sql`
						INSERT INTO discipline_levels (discipline_id, name, description, order_index, is_active)
						VALUES (${id}, ${level.name}, ${level.description || null}, ${level.order_index || 0}, ${level.is_active !== undefined ? level.is_active : true})
					`
				}
			}
		}

		// Obtener disciplina actualizada con sus niveles
		const updatedDiscipline = await sql`
			SELECT * FROM disciplines WHERE id = ${id}
		`

		const disciplineLevels = await sql`
			SELECT * FROM discipline_levels 
			WHERE discipline_id = ${id} AND is_active = true 
			ORDER BY order_index ASC
		`

		const result = {
			...updatedDiscipline[0],
			levels: disciplineLevels
		}

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

		const { id } = params

		// Soft delete: marcar como inactivo
		await sql`
			UPDATE disciplines 
			SET is_active = false, updated_at = NOW()
			WHERE id = ${id}
		`

		// También eliminar niveles relacionados (soft delete)
		await sql`
			UPDATE discipline_levels 
			SET is_active = false, updated_at = NOW()
			WHERE discipline_id = ${id}
		`

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting discipline:', error)
		return NextResponse.json(
			{ error: 'Error al eliminar disciplina' },
			{ status: 500 }
		)
	}
}