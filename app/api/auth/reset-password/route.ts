import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/reset-password
 * Valida el token y actualiza la contraseña del usuario
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Buscar el token válido
    const tokenResult = await sql`
      SELECT prt.*, u.id as user_id, u.email
      FROM password_reset_tokens prt
      INNER JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ${token}
        AND prt.expires_at > NOW()
        AND prt.used = false
    `

    if (!tokenResult || tokenResult.length === 0) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    const resetToken = tokenResult[0]

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Actualizar contraseña del usuario
    await sql`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE id = ${resetToken.user_id}
    `

    // Marcar token como usado
    await sql`
      UPDATE password_reset_tokens
      SET used = true, used_at = NOW()
      WHERE id = ${resetToken.id}
    `

    // Eliminar todos los tokens del usuario (por seguridad)
    await sql`
      DELETE FROM password_reset_tokens
      WHERE user_id = ${resetToken.user_id}
        AND used = false
    `

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    })
  } catch (error) {
    console.error('Error in reset-password:', error)
    return NextResponse.json(
      { error: 'Error al restablecer la contraseña' },
      { status: 500 }
    )
  }
}

