import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

// GET /api/coach/user-disciplines/[studentId] - Obtener disciplinas de un estudiante
export async function GET(
	request: NextRequest,
	{ params }: { params: { studentId: string } }
) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const coachUserId = normalizeUserId(session.user.id)
		if (!coachUserId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const studentId = parseInt(params.studentId, 10)

		if (isNaN(studentId)) {
			return NextResponse.json({ error: 'ID de estudiante inválido' }, { status: 400 })
		}

		// Verificar que el usuario es coach
		const coachCheck = await isCoach(coachUserId)
		if (!coachCheck) {
			return NextResponse.json({ error: 'Solo los coaches pueden acceder' }, { status: 403 })
		}

		// Obtener el coach profile
		const coachProfile = await prisma.coachProfile.findUnique({
			where: { userId: coachUserId! }
		})

		if (!coachProfile) {
			return NextResponse.json({ error: 'Perfil de coach no encontrado' }, { status: 404 })
		}

		// Verificar que el estudiante está asignado a este coach
		const relationship = await prisma.coachStudentRelationship.findFirst({
			where: {
				coachId: coachProfile.id,
				studentId: studentId,
				status: 'active'
			}
		})

		if (!relationship) {
			return NextResponse.json({ error: 'Estudiante no asignado a este coach' }, { status: 403 })
		}

		// Obtener disciplinas del estudiante
		const userDisciplines = await prisma.userDiscipline.findMany({
			where: { userId: studentId },
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
			},
			orderBy: {
				createdAt: 'desc'
			}
		})

		return NextResponse.json(userDisciplines)
	} catch (error) {
		console.error('Error fetching student disciplines:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// POST /api/coach/user-disciplines/[studentId] - Agregar disciplina a un estudiante
export async function POST(
	request: NextRequest,
	{ params }: { params: { studentId: string } }
) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const coachUserId = normalizeUserId(session.user.id)
		if (!coachUserId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const studentId = parseInt(params.studentId, 10)

		if (isNaN(studentId)) {
			return NextResponse.json({ error: 'ID de estudiante inválido' }, { status: 400 })
		}

		// Verificar que el usuario es coach
		const coachCheck = await isCoach(coachUserId)
		if (!coachCheck) {
			return NextResponse.json({ error: 'Solo los coaches pueden acceder' }, { status: 403 })
		}

		// Obtener el coach profile
		const coachProfile = await prisma.coachProfile.findUnique({
			where: { userId: coachUserId! }
		})

		if (!coachProfile) {
			return NextResponse.json({ error: 'Perfil de coach no encontrado' }, { status: 404 })
		}

		// Verificar que el estudiante está asignado a este coach
		const relationship = await prisma.coachStudentRelationship.findFirst({
			where: {
				coachId: coachProfile.id,
				studentId: studentId,
				status: 'active'
			}
		})

		if (!relationship) {
			return NextResponse.json({ error: 'Estudiante no asignado a este coach' }, { status: 403 })
		}

		const body = await request.json()
		const { disciplineId, levelId } = body

		if (!disciplineId) {
			return NextResponse.json({ error: 'disciplineId es requerido' }, { status: 400 })
		}

		const disciplineIdNum = parseInt(String(disciplineId), 10)
		if (isNaN(disciplineIdNum)) {
			return NextResponse.json({ error: 'disciplineId inválido' }, { status: 400 })
		}

		let levelIdNum: number | undefined = undefined
		if (levelId) {
			levelIdNum = parseInt(String(levelId), 10)
			if (isNaN(levelIdNum)) {
				return NextResponse.json({ error: 'levelId inválido' }, { status: 400 })
			}
		}

		// Verificar que la disciplina pertenece al coach
		const discipline = await prisma.discipline.findFirst({
			where: {
				id: disciplineIdNum,
				coachId: coachProfile.id
			}
		})

		if (!discipline) {
			return NextResponse.json({ error: 'Disciplina no encontrada o no pertenece al coach' }, { status: 404 })
		}

		// Verificar el nivel si se proporciona
		if (levelIdNum) {
			const level = await prisma.disciplineLevel.findFirst({
				where: {
					id: levelIdNum,
					disciplineId: disciplineIdNum
				}
			})

			if (!level) {
				return NextResponse.json({ error: 'Nivel no encontrado' }, { status: 404 })
			}
		}

		// Crear la relación
		const userDiscipline = await prisma.userDiscipline.create({
			data: {
				userId: studentId,
				disciplineId: disciplineIdNum,
				levelId: levelIdNum
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

		// Si el estudiante no tiene preferencias configuradas, establecer esta disciplina como preferida
		// Esto permite que el estudiante vea planificaciones inmediatamente sin tener que configurar manualmente
		const existingPreference = await prisma.userPreference.findUnique({
			where: { userId: studentId }
		})

		if (!existingPreference || !existingPreference.preferredDisciplineId) {
			// Solo actualizar si no tiene preferencia o no tiene disciplina preferida
			await prisma.userPreference.upsert({
				where: { userId: studentId },
				update: {
					preferredDisciplineId: disciplineIdNum,
					preferredLevelId: levelIdNum ?? null
				},
				create: {
					userId: studentId,
					preferredDisciplineId: disciplineIdNum,
					preferredLevelId: levelIdNum ?? null
				}
			})
		}

		return NextResponse.json(userDiscipline)
	} catch (error: any) {
		console.error('Error creating student discipline:', error)

		if (error.code === 'P2002') {
			return NextResponse.json({ error: 'El estudiante ya tiene asignada esta disciplina' }, { status: 409 })
		}

		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// DELETE /api/coach/user-disciplines/[studentId] - Eliminar disciplina de un estudiante
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { studentId: string } }
) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const coachUserId = normalizeUserId(session.user.id)
		if (!coachUserId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const studentId = parseInt(params.studentId, 10)

		if (isNaN(studentId)) {
			return NextResponse.json({ error: 'ID de estudiante inválido' }, { status: 400 })
		}

		// Verificar que el usuario es coach
		const coachCheck = await isCoach(coachUserId)
		if (!coachCheck) {
			return NextResponse.json({ error: 'Solo los coaches pueden acceder' }, { status: 403 })
		}

		// Obtener el coach profile
		const coachProfile = await prisma.coachProfile.findUnique({
			where: { userId: coachUserId! }
		})

		if (!coachProfile) {
			return NextResponse.json({ error: 'Perfil de coach no encontrado' }, { status: 404 })
		}

		// Verificar que el estudiante está asignado a este coach
		const relationship = await prisma.coachStudentRelationship.findFirst({
			where: {
				coachId: coachProfile.id,
				studentId: studentId,
				status: 'active'
			}
		})

		if (!relationship) {
			return NextResponse.json({ error: 'Estudiante no asignado a este coach' }, { status: 403 })
		}

		const { searchParams } = new URL(request.url)
		const userDisciplineId = searchParams.get('userDisciplineId')

		if (!userDisciplineId) {
			return NextResponse.json({ error: 'userDisciplineId es requerido' }, { status: 400 })
		}

		const userDisciplineIdNum = parseInt(userDisciplineId, 10)
		if (isNaN(userDisciplineIdNum)) {
			return NextResponse.json({ error: 'userDisciplineId inválido' }, { status: 400 })
		}

		// Verificar que la disciplina pertenece al estudiante
		const existingRelation = await prisma.userDiscipline.findFirst({
			where: {
				id: userDisciplineIdNum,
				userId: studentId
			}
		})

		if (!existingRelation) {
			return NextResponse.json({ error: 'Disciplina no encontrada' }, { status: 404 })
		}

		// Guardar el disciplineId antes de eliminar para verificar preferencias después
		const deletedDisciplineId = existingRelation.disciplineId

		// Eliminar
		await prisma.userDiscipline.delete({
			where: { id: userDisciplineIdNum }
		})

		// Si la disciplina eliminada era la preferida del estudiante, actualizar preferencias
		const userPreference = await prisma.userPreference.findUnique({
			where: { userId: studentId }
		})

		if (userPreference && userPreference.preferredDisciplineId === deletedDisciplineId) {
			// Buscar otra disciplina asignada al estudiante
			const remainingDiscipline = await prisma.userDiscipline.findFirst({
				where: { userId: studentId },
				include: { level: true }
			})

			if (remainingDiscipline) {
				// Asignar otra disciplina como preferida
				await prisma.userPreference.update({
					where: { userId: studentId },
					data: {
						preferredDisciplineId: remainingDiscipline.disciplineId,
						preferredLevelId: remainingDiscipline.levelId
					}
				})
			} else {
				// No quedan disciplinas, limpiar preferencias
				await prisma.userPreference.update({
					where: { userId: studentId },
					data: {
						preferredDisciplineId: null,
						preferredLevelId: null
					}
				})
			}
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting student discipline:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
