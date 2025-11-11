import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isCoach } from '@/lib/auth-helpers'

// PATCH /api/admin/users/[userId]
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { userId: string } }
) {
	try {
		const session = await auth()
		
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		let { email, full_name, avatar_url, password } = body

		// Verificar que el usuario es coach
		const authCheck = await isCoach(session.user.id)

		if (!authCheck.isAuthorized) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
		}

		const userId = parseInt(params.userId)

		// Validar que hay campos para actualizar
		if (email === undefined && full_name === undefined && avatar_url === undefined && password === undefined) {
			return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
		}

		// Verificar que el usuario existe
		const userExists = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true }
		})
		
		if (!userExists) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		// Preparar datos de actualización
		const updateData: any = {}

		// Si se está actualizando la contraseña, validarla y hashearla
		if (password !== undefined) {
			const trimmedPassword = password.trim()
			if (trimmedPassword.length < 6) {
				return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
			}
			updateData.password = await bcrypt.hash(trimmedPassword, 10)
		}

		// Validar formato de email si se está actualizando
		if (email !== undefined && email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(email)) {
				return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
			}

			// Verificar que el email no esté en uso por otro usuario
			const existingUser = await prisma.user.findFirst({
				where: {
					email,
					id: { not: userId }
				}
			})
			if (existingUser) {
				return NextResponse.json({ error: 'Este email ya está en uso por otro usuario' }, { status: 400 })
			}

			updateData.email = email
		}

		// Validar que full_name no sea una cadena vacía (debe ser null o un valor válido)
		if (full_name !== undefined) {
			updateData.name = full_name === '' ? null : full_name
		}

		if (avatar_url !== undefined) {
			updateData.image = avatar_url
		}

		// Actualizar usuario
		const updated = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				email: true,
				name: true,
				createdAt: true,
				updatedAt: true
			}
		})

		// Transformar para respuesta
		const result = {
			id: updated.id,
			email: updated.email,
			full_name: updated.name,
			created_at: updated.createdAt,
			updated_at: updated.updatedAt
		}

		return NextResponse.json(result)
	} catch (error: any) {
		console.error('Error updating user profile:', error)
		
		// Proporcionar más información sobre el error
		const errorMessage = error?.message || 'Error desconocido'
		const errorCode = error?.code || 'UNKNOWN'
		
		// Si es un error de base de datos, proporcionar más detalles
		if (error?.code) {
			console.error('Database error code:', error.code)
			console.error('Database error message:', error.message)
		}
		
		return NextResponse.json({ 
			error: 'Internal server error',
			details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
			code: process.env.NODE_ENV === 'development' ? errorCode : undefined
		}, { status: 500 })
	}
}

// DELETE /api/admin/users/[userId]
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { userId: string } }
) {
	try {
		const session = await auth()
		
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Verificar que el usuario es coach
		const authCheck = await isCoach(session.user.id)

		if (!authCheck.isAuthorized) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
		}

		const userId = parseInt(params.userId)

		// Verificar que el usuario existe
		const userExists = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true }
		})

		if (!userExists) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		// Eliminar datos relacionados en cascada usando transacción
		await prisma.$transaction(async (tx) => {
			// Eliminar en orden de dependencias
			await tx.userPreference.deleteMany({ where: { userId } })
			await tx.paymentHistory.deleteMany({ where: { userId } })
			await tx.subscription.deleteMany({ where: { userId } })
			await tx.userProgress.deleteMany({ where: { userId } })
			await tx.adminUserAssignment.deleteMany({ where: { userId } })
			await tx.userRole.deleteMany({ where: { userId } })
			await tx.workout.deleteMany({ where: { userId } })
			await tx.planification.deleteMany({ where: { userId } })
			
			// Finalmente, eliminar el usuario
			await tx.user.delete({ where: { id: userId } })
		})

		return NextResponse.json({ success: true, message: 'Usuario eliminado exitosamente' })
	} catch (error: any) {
		console.error('Error deleting user:', error)
		
		// Si hay error de foreign key constraint, informar mejor
		if (error?.code === '23503' || error?.message?.includes('foreign key')) {
			return NextResponse.json(
				{ error: 'No se puede eliminar el usuario porque tiene datos relacionados. Por favor, elimina primero las suscripciones y asignaciones.' },
				{ status: 400 }
			)
		}

		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}