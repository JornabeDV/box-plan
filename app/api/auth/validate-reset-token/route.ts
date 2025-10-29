import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

/**
 * GET /api/auth/validate-reset-token?token=xxx
 * Valida si un token de reset es válido y no ha expirado
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token no proporcionado' },
        { status: 400 }
      )
    }

    // Buscar token válido
    const tokenResult = await sql`
      SELECT id
      FROM password_reset_tokens
      WHERE token = ${token}
        AND expires_at > NOW()
        AND used = false
    `

    if (!tokenResult || tokenResult.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Token inválido o expirado'
      })
    }

    return NextResponse.json({
      valid: true
    })
  } catch (error) {
    console.error('Error validating reset token:', error)
    return NextResponse.json(
      { valid: false, error: 'Error al validar el token' },
      { status: 500 }
    )
  }
}