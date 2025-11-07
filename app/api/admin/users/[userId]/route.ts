import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'
import bcrypt from 'bcryptjs'

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

		// Verificar que el usuario existe y está asignado al admin
		// Primero obtenemos el admin_id del usuario actual
		const adminProfile = await sql`
			SELECT id FROM admin_profiles WHERE user_id = ${session.user.id}
		`

		if (adminProfile.length === 0) {
			return NextResponse.json({ error: 'Admin profile not found' }, { status: 403 })
		}

		const adminId = adminProfile[0].id

		// MVP - Modelo B2C: Permitir a cualquier admin gestionar cualquier usuario
		// TODO: Cuando migren a modelo con coaches/gimnasios, descomentar la validación:
		// Verificar que el usuario está asignado al admin
		// const assignment = await sql`
		//   SELECT user_id FROM admin_user_assignments 
		//   WHERE admin_id = ${adminId} AND user_id = ${params.userId} AND is_active = true
		// `
		// if (assignment.length === 0) {
		//   return NextResponse.json({ error: 'User not assigned to this admin' }, { status: 403 })
		// }

		// Validar que hay campos para actualizar
		if (email === undefined && full_name === undefined && avatar_url === undefined && password === undefined) {
			return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
		}

		// Verificar que el usuario existe
		const userExists = await sql`
			SELECT id FROM users WHERE id = ${params.userId}
		`
		
		if (userExists.length === 0) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		// Si se está actualizando la contraseña, validarla y hashearla
		if (password !== undefined) {
			const trimmedPassword = password.trim()
			if (trimmedPassword.length < 6) {
				return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
			}
			// Hashear la nueva contraseña
			const hashedPassword = await bcrypt.hash(trimmedPassword, 10)
			
			// Actualizar la contraseña
			await sql`
				UPDATE users 
				SET password = ${hashedPassword}
				WHERE id = ${params.userId}
			`
		}

		// Validar formato de email si se está actualizando
		if (email !== undefined && email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(email)) {
				return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
			}

			// Verificar que el email no esté en uso por otro usuario
			const existingUser = await sql`
				SELECT id FROM users WHERE email = ${email} AND id != ${params.userId}
			`
			if (existingUser.length > 0) {
				return NextResponse.json({ error: 'Este email ya está en uso por otro usuario' }, { status: 400 })
			}
		}

		// Validar que full_name no sea una cadena vacía (debe ser null o un valor válido)
		if (full_name !== undefined && full_name === '') {
			// Convertir cadena vacía a null
			full_name = null
		}

		// Actualizar perfil
		// Nota: Usamos la tabla 'users' directamente ya que 'profiles' puede no existir
		// Cuando se implemente la tabla profiles, cambiar a: UPDATE profiles
		// Por ahora actualizamos el campo 'name' que mapeamos a 'full_name' y 'email'
		
		// Construir query dinámicamente de forma segura
		// Intentar primero con created_at y updated_at si existen, sino usar valores por defecto
		let updated
		
		// Si solo se actualizó la contraseña, obtener el usuario actualizado
		if (password !== undefined && email === undefined && full_name === undefined) {
			try {
				updated = await sql`
					SELECT id, email, name as full_name, created_at, updated_at
					FROM users
					WHERE id = ${params.userId}
				`
			} catch (err: any) {
				if (err?.code === '42703' || err?.message?.includes('does not exist')) {
					updated = await sql`
						SELECT id, email, name as full_name, NOW() as created_at, NOW() as updated_at
						FROM users
						WHERE id = ${params.userId}
					`
				} else {
					throw err
				}
			}
		} else {
			try {
				if (email !== undefined && full_name !== undefined) {
				// Actualizar ambos campos
				// Manejar null explícitamente para full_name
				if (full_name === null) {
					updated = await sql`
						UPDATE users 
						SET email = ${email}, name = NULL, updated_at = NOW()
						WHERE id = ${params.userId}
						RETURNING id, email, name as full_name, created_at, updated_at
					`
				} else {
					updated = await sql`
						UPDATE users 
						SET email = ${email}, name = ${full_name}, updated_at = NOW()
						WHERE id = ${params.userId}
						RETURNING id, email, name as full_name, created_at, updated_at
					`
				}
			} else if (email !== undefined) {
				// Solo actualizar email
				updated = await sql`
					UPDATE users 
					SET email = ${email}, updated_at = NOW()
					WHERE id = ${params.userId}
					RETURNING id, email, name as full_name, created_at, updated_at
				`
			} else if (full_name !== undefined) {
				// Solo actualizar nombre
				// Manejar null explícitamente
				if (full_name === null) {
					updated = await sql`
						UPDATE users 
						SET name = NULL, updated_at = NOW()
						WHERE id = ${params.userId}
						RETURNING id, email, name as full_name, created_at, updated_at
					`
				} else {
					updated = await sql`
						UPDATE users 
						SET name = ${full_name}, updated_at = NOW()
						WHERE id = ${params.userId}
						RETURNING id, email, name as full_name, created_at, updated_at
					`
				}
			} else {
				// Solo actualizar updated_at (aunque no debería llegar aquí por la validación anterior)
				updated = await sql`
					UPDATE users 
					SET updated_at = NOW()
					WHERE id = ${params.userId}
					RETURNING id, email, name as full_name, created_at, updated_at
				`
			}
		} catch (err: any) {
			// Si created_at o updated_at no existen, hacer query sin esos campos
			if (err?.code === '42703' || err?.message?.includes('does not exist')) {
				if (email !== undefined && full_name !== undefined) {
					// Actualizar ambos campos sin updated_at
					// Manejar null explícitamente para full_name
					if (full_name === null) {
						updated = await sql`
							UPDATE users 
							SET email = ${email}, name = NULL
							WHERE id = ${params.userId}
							RETURNING id, email, name as full_name, NOW() as created_at, NOW() as updated_at
						`
					} else {
						updated = await sql`
							UPDATE users 
							SET email = ${email}, name = ${full_name}
							WHERE id = ${params.userId}
							RETURNING id, email, name as full_name, NOW() as created_at, NOW() as updated_at
						`
					}
				} else if (email !== undefined) {
					// Solo actualizar email sin updated_at
					updated = await sql`
						UPDATE users 
						SET email = ${email}
						WHERE id = ${params.userId}
						RETURNING id, email, name as full_name, NOW() as created_at, NOW() as updated_at
					`
				} else if (full_name !== undefined) {
					// Solo actualizar nombre sin updated_at
					// Manejar null explícitamente
					if (full_name === null) {
						updated = await sql`
							UPDATE users 
							SET name = NULL
							WHERE id = ${params.userId}
							RETURNING id, email, name as full_name, NOW() as created_at, NOW() as updated_at
						`
					} else {
						updated = await sql`
							UPDATE users 
							SET name = ${full_name}
							WHERE id = ${params.userId}
							RETURNING id, email, name as full_name, NOW() as created_at, NOW() as updated_at
						`
					}
				} else {
					// No hay campos para actualizar (no debería llegar aquí por la validación anterior)
					// Solo retornar el usuario sin actualizar
					updated = await sql`
						SELECT id, email, name as full_name, NOW() as created_at, NOW() as updated_at
						FROM users
						WHERE id = ${params.userId}
					`
				}
			} else {
				throw err
			}
		}
		}

		if (!updated || updated.length === 0) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		return NextResponse.json(updated[0])
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

		// Verificar que el usuario es admin
		const adminProfile = await sql`
			SELECT id FROM admin_profiles WHERE user_id = ${session.user.id}
		`

		if (adminProfile.length === 0) {
			return NextResponse.json({ error: 'Admin profile not found' }, { status: 403 })
		}

		const adminId = adminProfile[0].id

		// MVP - Modelo B2C: Permitir a cualquier admin eliminar cualquier usuario
		// TODO: Cuando migren a modelo con coaches/gimnasios, descomentar la validación:
		// Verificar que el usuario está asignado al admin
		// const assignment = await sql`
		//   SELECT user_id FROM admin_user_assignments 
		//   WHERE admin_id = ${adminId} AND user_id = ${params.userId} AND is_active = true
		// `
		// if (assignment.length === 0) {
		//   return NextResponse.json({ error: 'User not assigned to this admin' }, { status: 403 })
		// }

		// Verificar que el usuario existe
		const userExists = await sql`
			SELECT id FROM users WHERE id = ${params.userId}
		`

		if (userExists.length === 0) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		// Eliminar datos relacionados en cascada (en orden de dependencias)
		// 1. Preferencias de usuario
		try {
			await sql`DELETE FROM user_preferences WHERE user_id = ${params.userId}`
		} catch (err) {
			// Ignorar si la tabla no existe o no hay datos
		}

		// 2. Asignaciones de planillas de entrenamiento
		try {
			await sql`DELETE FROM workout_sheet_assignments WHERE user_id = ${params.userId}`
		} catch (err) {
			// Ignorar si la tabla no existe o no hay datos
		}

		// 3. Planillas de usuario
		try {
			await sql`DELETE FROM user_workout_sheets WHERE user_id = ${params.userId}`
		} catch (err) {
			// Ignorar si la tabla no existe o no hay datos
		}

		// 4. Historial de pagos
		try {
			await sql`DELETE FROM payment_history WHERE user_id = ${params.userId}`
		} catch (err) {
			// Ignorar si la tabla no existe o no hay datos
		}

		// 5. Suscripciones
		try {
			await sql`DELETE FROM subscriptions WHERE user_id = ${params.userId}`
		} catch (err) {
			// Ignorar si la tabla no existe o no hay datos
		}

		// 6. Progreso de usuario
		try {
			await sql`DELETE FROM user_progress WHERE user_id = ${params.userId}`
		} catch (err) {
			// Ignorar si la tabla no existe o no hay datos
		}

		// 7. Asignaciones admin-user (si existen)
		try {
			await sql`DELETE FROM admin_user_assignments WHERE user_id = ${params.userId}`
		} catch (err) {
			// Ignorar si la tabla no existe o no hay datos
		}

		// 8. Roles de usuario
		try {
			await sql`DELETE FROM user_roles_simple WHERE user_id = ${params.userId}`
		} catch (err) {
			// Ignorar si la tabla no existe o no hay datos
		}

		// 9. Finalmente, eliminar el usuario
		await sql`DELETE FROM users WHERE id = ${params.userId}`

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