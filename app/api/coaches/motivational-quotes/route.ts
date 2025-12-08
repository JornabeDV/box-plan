import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { canCoachUseCustomMotivationalQuotes } from '@/lib/coach-plan-features'

const MAX_QUOTES = 10
const MAX_QUOTE_LENGTH = 500

/**
 * GET /api/coaches/motivational-quotes
 * Obtiene todas las frases motivacionales del coach autenticado
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

		// Verificar que el usuario es coach
		const coachProfile = await prisma.coachProfile.findUnique({
			where: { userId }
		})

		if (!coachProfile) {
			return NextResponse.json(
				{ error: 'Solo los coaches pueden acceder a sus frases motivacionales' },
				{ status: 403 }
			)
		}

		// Obtener todas las frases ordenadas por orderIndex
		const quotes = await prisma.coachMotivationalQuote.findMany({
			where: {
				coachId: coachProfile.id
			},
			orderBy: [
				{ orderIndex: 'asc' },
				{ createdAt: 'asc' }
			]
		})

		return NextResponse.json({
			quotes
		})

	} catch (error) {
		console.error('Error obteniendo frases motivacionales:', error)
		return NextResponse.json(
			{ error: 'Error al obtener frases motivacionales' },
			{ status: 500 }
		)
	}
}

/**
 * POST /api/coaches/motivational-quotes
 * Crea una nueva frase motivacional
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		if (!userId) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		// Verificar que el usuario es coach
		const coachProfile = await prisma.coachProfile.findUnique({
			where: { userId }
		})

		if (!coachProfile) {
			return NextResponse.json(
				{ error: 'Solo los coaches pueden crear frases motivacionales' },
				{ status: 403 }
			)
		}

		// Verificar que tiene la feature habilitada
		const hasFeature = await canCoachUseCustomMotivationalQuotes(coachProfile.id)
		if (!hasFeature) {
			return NextResponse.json(
				{ error: 'Tu plan no incluye frases motivacionales personalizadas' },
				{ status: 403 }
			)
		}

		// Verificar límite de frases
		const quoteCount = await prisma.coachMotivationalQuote.count({
			where: {
				coachId: coachProfile.id
			}
		})

		if (quoteCount >= MAX_QUOTES) {
			return NextResponse.json(
				{ error: `Has alcanzado el límite de ${MAX_QUOTES} frases motivacionales` },
				{ status: 400 }
			)
		}

		const body = await request.json()
		const { quote, orderIndex, isActive } = body

		// Validaciones
		if (!quote || typeof quote !== 'string' || quote.trim().length === 0) {
			return NextResponse.json(
				{ error: 'La frase es requerida' },
				{ status: 400 }
			)
		}

		if (quote.length > MAX_QUOTE_LENGTH) {
			return NextResponse.json(
				{ error: `La frase no puede exceder ${MAX_QUOTE_LENGTH} caracteres` },
				{ status: 400 }
			)
		}

		// Crear la frase
		const newQuote = await prisma.coachMotivationalQuote.create({
			data: {
				coachId: coachProfile.id,
				quote: quote.trim(),
				orderIndex: orderIndex ?? quoteCount,
				isActive: isActive !== undefined ? isActive : true
			}
		})

		return NextResponse.json({
			success: true,
			quote: newQuote
		})

	} catch (error) {
		console.error('Error creando frase motivacional:', error)
		return NextResponse.json(
			{ error: 'Error al crear frase motivacional' },
			{ status: 500 }
		)
	}
}

