import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

// PUT /api/user-disciplines/[id] - Actualizar nivel de una disciplina
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = normalizeUserId(session.user.id)
		const userDisciplineId = parseInt(params.id, 10)

		if (isNaN(userDisciplineId)) {
			return NextResponse.json(
				{ error: 'ID inválido' },
				{ status: 400 }
			)
		}

		const body = await request.json()
		const { levelId, preferredLevelId } = body

		// Verificar que la relación existe y pertenece al usuario
		const existingRelation = await prisma.userDiscipline.findFirst({
			where: {
				id: userDisciplineId,
				userId: userId!
			},
			include: {
				discipline: true
			}
		})

		if (!existingRelation) {
			return NextResponse.json(
				{ error: 'Relación no encontrada' },
				{ status: 404 }
			)
		}

		// Helper para validar nivel
		const validateLevel = async (value: unknown): Promise<number | null | undefined> => {
			if (value === undefined) return undefined
			if (value === null) return null
			const num = parseInt(String(value), 10)
			if (isNaN(num)) {
				throw new Error('levelId debe ser un número válido')
			}
			const level = await prisma.disciplineLevel.findFirst({
				where: {
					id: num,
					disciplineId: existingRelation.disciplineId
				}
			})
			if (!level) {
				throw new Error('Nivel no encontrado o no pertenece a la disciplina')
			}
			return num
		}

		let levelIdNum: number | null | undefined = undefined
		let preferredLevelIdNum: number | null | undefined = undefined

		try {
			levelIdNum = await validateLevel(levelId)
			preferredLevelIdNum = await validateLevel(preferredLevelId)
		} catch (err: any) {
			return NextResponse.json(
				{ error: err.message },
				{ status: 400 }
			)
		}

		// Actualizar
		const updated = await prisma.userDiscipline.update({
			where: { id: userDisciplineId },
			data: {
				levelId: levelIdNum,
				preferredLevelId: preferredLevelIdNum ?? levelIdNum
			},
			include: {
				discipline: {
					select: {
						id: true,
						name: true,
						color: true
					}
				},
				level: {
					select: {
						id: true,
						name: true
					}
				},
				preferredLevel: {
					select: {
						id: true,
						name: true
					}
				}
			}
		})

		return NextResponse.json(updated)
	} catch (error) {
		console.error('Error updating user discipline:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// DELETE /api/user-disciplines/[id] - Eliminar una disciplina del usuario
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = normalizeUserId(session.user.id)
		const userDisciplineId = parseInt(params.id, 10)

		if (isNaN(userDisciplineId)) {
			return NextResponse.json(
				{ error: 'ID inválido' },
				{ status: 400 }
			)
		}

		// Verificar que la relación existe y pertenece al usuario
		const existingRelation = await prisma.userDiscipline.findFirst({
			where: {
				id: userDisciplineId,
				userId: userId!
			}
		})

		if (!existingRelation) {
			return NextResponse.json(
				{ error: 'Relación no encontrada' },
				{ status: 404 }
			)
		}

		// Eliminar
		await prisma.userDiscipline.delete({
			where: { id: userDisciplineId }
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting user discipline:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
