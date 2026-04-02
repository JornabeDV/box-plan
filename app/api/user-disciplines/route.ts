import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

// GET /api/user-disciplines - Obtener disciplinas del usuario actual
export async function GET(request: NextRequest) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = normalizeUserId(session.user.id)

		const userDisciplines = await prisma.userDiscipline.findMany({
			where: { userId: userId! },
			include: {
				discipline: {
					select: {
						id: true,
						name: true,
						color: true,
						description: true
					}
				},
				level: {
					select: {
						id: true,
						name: true,
						description: true
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		})

		return NextResponse.json(userDisciplines)
	} catch (error) {
		console.error('Error fetching user disciplines:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// POST /api/user-disciplines - Agregar una disciplina al usuario
export async function POST(request: NextRequest) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = normalizeUserId(session.user.id)
		const body = await request.json()
		const { disciplineId, levelId } = body

		// Validaciones
		if (!disciplineId) {
			return NextResponse.json(
				{ error: 'disciplineId es requerido' },
				{ status: 400 }
			)
		}

		const disciplineIdNum = parseInt(String(disciplineId), 10)
		if (isNaN(disciplineIdNum)) {
			return NextResponse.json(
				{ error: 'disciplineId debe ser un número válido' },
				{ status: 400 }
			)
		}

		let levelIdNum: number | null = null
		if (levelId) {
			levelIdNum = parseInt(String(levelId), 10)
			if (isNaN(levelIdNum)) {
				return NextResponse.json(
					{ error: 'levelId debe ser un número válido' },
					{ status: 400 }
				)
			}
		}

		// Verificar que la disciplina existe
		const discipline = await prisma.discipline.findUnique({
			where: { id: disciplineIdNum }
		})

		if (!discipline) {
			return NextResponse.json(
				{ error: 'Disciplina no encontrada' },
				{ status: 404 }
			)
		}

		// Verificar que el nivel existe y pertenece a la disciplina (si se proporcionó)
		if (levelIdNum) {
			const level = await prisma.disciplineLevel.findFirst({
				where: {
					id: levelIdNum,
					disciplineId: disciplineIdNum
				}
			})

			if (!level) {
				return NextResponse.json(
					{ error: 'Nivel no encontrado o no pertenece a la disciplina' },
					{ status: 400 }
				)
			}
		}

		// Crear la relación
		const userDiscipline = await prisma.userDiscipline.create({
			data: {
				userId: userId!,
				disciplineId: disciplineIdNum,
				levelId: levelIdNum ?? undefined
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
				}
			}
		})

		return NextResponse.json(userDiscipline)
	} catch (error: any) {
		console.error('Error creating user discipline:', error)

		// Manejar error de duplicado (unique constraint)
		if (error.code === 'P2002') {
			return NextResponse.json(
				{ error: 'El usuario ya tiene asignada esta disciplina' },
				{ status: 409 }
			)
		}

		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
