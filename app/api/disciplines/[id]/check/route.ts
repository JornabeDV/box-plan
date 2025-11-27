import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/disciplines/[id]/check
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const disciplineId = parseInt(params.id)

		if (isNaN(disciplineId)) {
			return NextResponse.json(
				{ error: 'Invalid discipline ID' },
				{ status: 400 }
			)
		}

		// Verificar que la disciplina existe
		const existingDiscipline = await prisma.discipline.findUnique({
			where: { id: disciplineId },
			select: { id: true, name: true }
		})

		if (!existingDiscipline) {
			return NextResponse.json(
				{ error: 'Disciplina no encontrada' },
				{ status: 404 }
			)
		}

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

		// Combinar usuarios únicos
		const totalUsers = new Set([
			...usersWithDisciplinePreference.map(u => u.userId),
			...usersWithLevelPreference.map(u => u.userId)
		]).size

		return NextResponse.json({
			canDelete: totalUsers === 0,
			userCount: totalUsers,
			disciplineName: existingDiscipline.name
		})
	} catch (error) {
		console.error('Error checking discipline deletion:', error)
		return NextResponse.json(
			{ error: 'Error al verificar disciplina' },
			{ status: 500 }
		)
	}
}
