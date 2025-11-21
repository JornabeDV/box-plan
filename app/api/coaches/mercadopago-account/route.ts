import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint para actualizar manualmente el Account ID de MercadoPago
 * Útil como alternativa al OAuth o para correcciones manuales
 */
export async function PUT(request: NextRequest) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		// Verificar que el usuario es coach
		const coachProfile = await prisma.coachProfile.findUnique({
			where: { userId: Number(session.user.id) }
		})

		if (!coachProfile) {
			return NextResponse.json(
				{ error: 'Solo los coaches pueden actualizar su Account ID' },
				{ status: 403 }
			)
		}

		const { accountId } = await request.json()

		if (!accountId || typeof accountId !== 'string') {
			return NextResponse.json(
				{ error: 'Account ID es requerido' },
				{ status: 400 }
			)
		}

		// Validar formato básico (solo números, puede tener guiones)
		if (!/^[\d-]+$/.test(accountId)) {
			return NextResponse.json(
				{ error: 'Formato de Account ID inválido' },
				{ status: 400 }
			)
		}

		// Actualizar Account ID
		await prisma.coachProfile.update({
			where: { id: coachProfile.id },
			data: {
				mercadopagoAccountId: accountId
			}
		})

		return NextResponse.json({
			success: true,
			message: 'Account ID actualizado correctamente'
		})

	} catch (error) {
		console.error('Error actualizando Account ID:', error)
		return NextResponse.json(
			{ error: 'Error al actualizar Account ID' },
			{ status: 500 }
		)
	}
}

/**
 * Obtener el Account ID actual del coach
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		const coachProfile = await prisma.coachProfile.findUnique({
			where: { userId: Number(session.user.id) },
			select: {
				id: true,
				mercadopagoAccountId: true
			}
		})

		if (!coachProfile) {
			return NextResponse.json(
				{ error: 'Usuario no es coach' },
				{ status: 403 }
			)
		}

		return NextResponse.json({
			accountId: coachProfile.mercadopagoAccountId,
			connected: !!coachProfile.mercadopagoAccountId
		})

	} catch (error) {
		console.error('Error obteniendo Account ID:', error)
		return NextResponse.json(
			{ error: 'Error al obtener Account ID' },
			{ status: 500 }
		)
	}
}