import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/students/coach-motivational-quotes
 * Obtiene las frases motivacionales del coach del estudiante autenticado
 * Solo devuelve frases activas, ordenadas por orderIndex
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		if (!userId) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		// Buscar la relación activa con un coach
		const relationship = await prisma.coachStudentRelationship.findFirst({
			where: {
				studentId: userId,
				status: 'active'
			},
			include: {
				coach: true
			}
		})

		if (!relationship) {
			// Si no tiene coach, devolver array vacío (no es un error)
			return NextResponse.json({
				quotes: []
			})
		}

		// Obtener frases activas del coach, ordenadas
		const quotes = await prisma.coachMotivationalQuote.findMany({
			where: {
				coachId: relationship.coachId,
				isActive: true
			},
			orderBy: [
				{ orderIndex: 'asc' },
				{ createdAt: 'asc' }
			],
			select: {
				id: true,
				quote: true,
				orderIndex: true
			}
		})

		return NextResponse.json({
			quotes: quotes.map(q => q.quote)
		})

	} catch (error) {
		console.error('Error obteniendo frases del coach:', error)
		return NextResponse.json(
			{ error: 'Error al obtener frases motivacionales' },
			{ status: 500 }
		)
	}
}

