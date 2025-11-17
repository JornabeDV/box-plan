import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

// POST /api/disciplines/levels
export async function POST(request: NextRequest) {
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

		const body = await request.json()
		const { discipline_id, name, description, order_index } = body

		if (!discipline_id) {
			return NextResponse.json(
				{ error: 'Discipline ID requerido' },
				{ status: 400 }
			)
		}

		if (!name || typeof name !== 'string' || name.trim() === '') {
			return NextResponse.json(
				{ error: 'Nombre del nivel requerido' },
				{ status: 400 }
			)
		}

		const disciplineId = typeof discipline_id === 'string' 
			? parseInt(discipline_id, 10) 
			: discipline_id

		if (isNaN(disciplineId)) {
			return NextResponse.json(
				{ error: 'Invalid discipline ID' },
				{ status: 400 }
			)
		}

		// Verificar que la disciplina existe y pertenece al coach
		const discipline = await prisma.discipline.findFirst({
			where: {
				id: disciplineId,
				coachId: (authCheck.profile as any).id,
				isActive: true
			}
		})

		if (!discipline) {
			return NextResponse.json(
				{ error: 'Disciplina no encontrada' },
				{ status: 404 }
			)
		}

		// Crear el nivel
		const newLevel = await prisma.disciplineLevel.create({
			data: {
				disciplineId,
				name: name.trim(),
				description: description?.trim() || null,
				orderIndex: order_index ?? 0
			}
		})

		// Transformar al formato esperado por el frontend
		const transformedLevel = {
			id: String(newLevel.id),
			discipline_id: String(newLevel.disciplineId),
			name: newLevel.name,
			description: newLevel.description || undefined,
			order_index: newLevel.orderIndex,
			is_active: newLevel.isActive,
			created_at: newLevel.createdAt.toISOString(),
			updated_at: newLevel.updatedAt.toISOString()
		}

		return NextResponse.json(transformedLevel)
	} catch (error) {
		console.error('Error creating discipline level:', error)
		return NextResponse.json(
			{ error: 'Error al crear nivel' },
			{ status: 500 }
		)
	}
}