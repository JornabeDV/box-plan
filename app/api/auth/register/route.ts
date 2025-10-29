import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/neon'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario con UUID
    const userId = randomUUID()

    await sql`
      INSERT INTO users (id, email, password, name)
      VALUES (${userId}, ${email}, ${hashedPassword}, ${name || email.split('@')[0]})
    `

    // Crear rol de usuario por defecto
    const roleId = randomUUID()
    await sql`
      INSERT INTO user_roles_simple (id, user_id, role)
      VALUES (${roleId}, ${userId}, 'user')
    `

    return NextResponse.json({ 
      success: true,
      message: 'Usuario creado exitosamente',
      userId 
    })
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: 'Error al crear la cuenta' },
      { status: 500 }
    )
  }
}