import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { uploadImageToCloudinary, deleteImageFromCloudinary, isCloudinaryUrl } from '@/lib/cloudinary'

/**
 * POST /api/coaches/logo/upload
 * Sube un logo del coach a Cloudinary y actualiza el perfil
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
				{ error: 'Solo los coaches pueden subir su logo' },
				{ status: 403 }
			)
		}

		// Obtener el archivo del FormData
		const formData = await request.formData()
		const file = formData.get('file') as File | null

		if (!file) {
			return NextResponse.json(
				{ error: 'No se proporcionó ningún archivo' },
				{ status: 400 }
			)
		}

		// Validar tipo de archivo
		if (!file.type.startsWith('image/')) {
			return NextResponse.json(
				{ error: 'El archivo debe ser una imagen' },
				{ status: 400 }
			)
		}

		// Validar tamaño (máximo 5MB)
		const maxSize = 5 * 1024 * 1024 // 5MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: 'El archivo es demasiado grande. Máximo 5MB' },
				{ status: 400 }
			)
		}

		// Convertir File a Buffer
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// Si ya tiene un logo en Cloudinary, eliminarlo primero
		if (coachProfile.logoUrl && isCloudinaryUrl(coachProfile.logoUrl)) {
			try {
				await deleteImageFromCloudinary(coachProfile.logoUrl)
			} catch (error) {
				console.error('Error eliminando logo anterior:', error)
				// Continuar aunque falle la eliminación
			}
		}

		// Subir a Cloudinary con public_id personalizado basado en el coachId
		const publicId = `coach-${coachProfile.id}-logo`
		const imageUrl = await uploadImageToCloudinary(
			buffer,
			'coach-logos',
			publicId
		)

		// Actualizar el perfil del coach
		const updated = await prisma.coachProfile.update({
			where: { id: coachProfile.id },
			data: {
				logoUrl: imageUrl
			}
		})

		return NextResponse.json({
			success: true,
			logoUrl: updated.logoUrl
		})

	} catch (error) {
		console.error('Error subiendo logo del coach:', error)
		return NextResponse.json(
			{ error: 'Error al subir logo' },
			{ status: 500 }
		)
	}
}
