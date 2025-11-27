import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/disciplines/levels/[id]/check
export async function GET(
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
			select: { id: true, name: true, disciplineId: true }
		})

		if (!existingLevel) {
			return NextResponse.json(
				{ error: 'Nivel no encontrado' },
				{ status: 404 }
			)
		}

		// Verificar si hay usuarios con preferencias vinculadas a este nivel
		const usersWithLevelPreference = await prisma.userPreference.findMany({
			where: {
				preferredLevelId: levelId
			},
			select: {
				userId: true
			}
		})

		return NextResponse.json({
			canDelete: usersWithLevelPreference.length === 0,
			userCount: usersWithLevelPreference.length,
			levelName: existingLevel.name
		})
	} catch (error) {
		console.error('Error checking level deletion:', error)
		return NextResponse.json(
			{ error: 'Error al verificar nivel' },
			{ status: 500 }
		)
	}
}
