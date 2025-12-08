import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { canCoachUseCustomMotivationalQuotes } from '@/lib/coach-plan-features'

const MAX_QUOTE_LENGTH = 500

/**
 * PUT /api/coaches/motivational-quotes/[id]
 * Actualiza una frase motivacional existente
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
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
				{ error: 'Solo los coaches pueden actualizar frases motivacionales' },
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

		const quoteId = parseInt(params.id)
		if (isNaN(quoteId)) {
			return NextResponse.json(
				{ error: 'ID de frase inválido' },
				{ status: 400 }
			)
		}

		// Verificar que la frase existe y pertenece al coach
		const existingQuote = await prisma.coachMotivationalQuote.findUnique({
			where: { id: quoteId }
		})

		if (!existingQuote) {
			return NextResponse.json(
				{ error: 'Frase no encontrada' },
				{ status: 404 }
			)
		}

		if (existingQuote.coachId !== coachProfile.id) {
			return NextResponse.json(
				{ error: 'No tienes permiso para actualizar esta frase' },
				{ status: 403 }
			)
		}

		const body = await request.json()
		const { quote, orderIndex, isActive } = body

		// Validaciones
		const updateData: any = {}

		if (quote !== undefined) {
			if (typeof quote !== 'string' || quote.trim().length === 0) {
				return NextResponse.json(
					{ error: 'La frase no puede estar vacía' },
					{ status: 400 }
				)
			}

			if (quote.length > MAX_QUOTE_LENGTH) {
				return NextResponse.json(
					{ error: `La frase no puede exceder ${MAX_QUOTE_LENGTH} caracteres` },
					{ status: 400 }
				)
			}

			updateData.quote = quote.trim()
		}

		if (orderIndex !== undefined) {
			if (typeof orderIndex !== 'number' || orderIndex < 0) {
				return NextResponse.json(
					{ error: 'El índice de orden debe ser un número positivo' },
					{ status: 400 }
				)
			}
			updateData.orderIndex = orderIndex
		}

		if (isActive !== undefined) {
			if (typeof isActive !== 'boolean') {
				return NextResponse.json(
					{ error: 'isActive debe ser un booleano' },
					{ status: 400 }
				)
			}
			updateData.isActive = isActive
		}

		// Actualizar la frase
		const updatedQuote = await prisma.coachMotivationalQuote.update({
			where: { id: quoteId },
			data: updateData
		})

		return NextResponse.json({
			success: true,
			quote: updatedQuote
		})

	} catch (error) {
		console.error('Error actualizando frase motivacional:', error)
		return NextResponse.json(
			{ error: 'Error al actualizar frase motivacional' },
			{ status: 500 }
		)
	}
}

/**
 * DELETE /api/coaches/motivational-quotes/[id]
 * Elimina una frase motivacional
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
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
				{ error: 'Solo los coaches pueden eliminar frases motivacionales' },
				{ status: 403 }
			)
		}

		const quoteId = parseInt(params.id)
		if (isNaN(quoteId)) {
			return NextResponse.json(
				{ error: 'ID de frase inválido' },
				{ status: 400 }
			)
		}

		// Verificar que la frase existe y pertenece al coach
		const existingQuote = await prisma.coachMotivationalQuote.findUnique({
			where: { id: quoteId }
		})

		if (!existingQuote) {
			return NextResponse.json(
				{ error: 'Frase no encontrada' },
				{ status: 404 }
			)
		}

		if (existingQuote.coachId !== coachProfile.id) {
			return NextResponse.json(
				{ error: 'No tienes permiso para eliminar esta frase' },
				{ status: 403 }
			)
		}

		// Eliminar la frase
		await prisma.coachMotivationalQuote.delete({
			where: { id: quoteId }
		})

		return NextResponse.json({
			success: true,
			message: 'Frase eliminada correctamente'
		})

	} catch (error) {
		console.error('Error eliminando frase motivacional:', error)
		return NextResponse.json(
			{ error: 'Error al eliminar frase motivacional' },
			{ status: 500 }
		)
	}
}

