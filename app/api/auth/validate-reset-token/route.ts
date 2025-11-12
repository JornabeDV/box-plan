import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    const tokenResult = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
        used: false
      },
      select: { id: true }
    })

    if (!tokenResult) {
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