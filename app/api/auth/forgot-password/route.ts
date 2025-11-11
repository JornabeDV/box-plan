import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { Resend } from 'resend'

/**
 * POST /api/auth/forgot-password
 * Crea un token de reset de contraseña y envía un email al usuario
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de restablecimiento.'
      })
    }

    // Generar token único
    const resetToken = nanoid(32)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Token válido por 1 hora

    // Eliminar tokens previos del usuario y crear nuevo token
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id }
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt
        }
      })
    ])

    // Generar URL de reset
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    // Intentar enviar email
    try {
      await sendResetEmail(user.email, user.name || user.email, resetUrl)
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // No fallar si el email falla, pero loguear
    }

    return NextResponse.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace de restablecimiento.'
    })
  } catch (error) {
    console.error('Error in forgot-password:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

/**
 * Función para enviar email de reset usando Resend
 */
async function sendResetEmail(email: string, userName: string, resetUrl: string) {
  const resendApiKey = process.env.RESEND_API_KEY
  
  if (!resendApiKey) {
    // En desarrollo, loguear el URL si no hay API key
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  RESEND_API_KEY no configurada. Reset URL:', resetUrl)
    }
    return
  }

  try {
    const resend = new Resend(resendApiKey)
    
    const fromEmail = process.env.FROM_EMAIL || 'noreply@boxplan.com'
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Restablecer tu contraseña - Box Plan',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #059669; margin-top: 0;">Restablecer Contraseña</h2>
              <p>Hola ${userName},</p>
              <p>Recibimos una solicitud para restablecer tu contraseña en <strong>Box Plan</strong>.</p>
              <p>Haz clic en el botón para restablecer tu contraseña:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Restablecer Contraseña
                </a>
              </div>
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #666; background-color: #f9f9f9; padding: 10px; border-radius: 4px; font-size: 12px;">
                ${resetUrl}
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #666; font-size: 12px; margin-bottom: 0;">
                ⚠️ Este enlace expirará en 1 hora.<br>
                Si no solicitaste este cambio, ignora este email. Tu contraseña no será modificada.
              </p>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('Error enviando email con Resend:', error)
      throw error
    }

    console.log('✅ Email de reset enviado a:', email, 'ID:', data?.id)
  } catch (error) {
    console.error('Error en sendResetEmail:', error)
    throw error
  }
}