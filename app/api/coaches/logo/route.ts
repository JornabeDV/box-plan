import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { deleteImageFromCloudinary, isCloudinaryUrl } from '@/lib/cloudinary'

/**
 * PUT /api/coaches/logo
 * Actualiza el logo del coach
 */
export async function PUT(request: NextRequest) {
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
				{ error: 'Solo los coaches pueden actualizar su logo' },
				{ status: 403 }
			)
		}

		const body = await request.json()
		const { logoUrl } = body

		// Validar que logoUrl sea una URL válida o null
		if (logoUrl !== null && logoUrl !== undefined) {
			if (typeof logoUrl !== 'string') {
				return NextResponse.json(
					{ error: 'logoUrl debe ser una URL válida' },
					{ status: 400 }
				)
			}

			// Validar formato básico de URL
			try {
				new URL(logoUrl)
			} catch {
				return NextResponse.json(
					{ error: 'URL inválida' },
					{ status: 400 }
				)
			}

			// Validar longitud máxima
			if (logoUrl.length > 500) {
				return NextResponse.json(
					{ error: 'La URL del logo es demasiado larga (máximo 500 caracteres)' },
					{ status: 400 }
				)
			}
		}

		// Si se está eliminando el logo y es de Cloudinary, eliminarlo también de Cloudinary
		if (!logoUrl && coachProfile.logoUrl && isCloudinaryUrl(coachProfile.logoUrl)) {
			try {
				await deleteImageFromCloudinary(coachProfile.logoUrl)
			} catch (error) {
				console.error('Error eliminando logo de Cloudinary:', error)
				// Continuar aunque falle la eliminación
			}
		}

		// Actualizar logo
		const updated = await prisma.coachProfile.update({
			where: { id: coachProfile.id },
			data: {
				logoUrl: logoUrl || null
			}
		})

		return NextResponse.json({
			success: true,
			logoUrl: updated.logoUrl
		})

	} catch (error) {
		console.error('Error actualizando logo del coach:', error)
		return NextResponse.json(
			{ error: 'Error al actualizar logo' },
			{ status: 500 }
		)
	}
}

/**
 * GET /api/coaches/logo
 * Obtiene el logo del coach actual
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
			where: { userId },
			select: {
				logoUrl: true
			}
		})

		if (!coachProfile) {
			return NextResponse.json(
				{ error: 'Coach no encontrado' },
				{ status: 404 }
			)
		}

		return NextResponse.json({
			logoUrl: coachProfile.logoUrl
		})

	} catch (error) {
		console.error('Error obteniendo logo del coach:', error)
		return NextResponse.json(
			{ error: 'Error al obtener logo' },
			{ status: 500 }
		)
	}
}
