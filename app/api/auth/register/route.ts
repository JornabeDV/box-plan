import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario y rol en una transacción
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        phone: phone || null,
        roles: {
          create: {
            role: 'user'
          }
        }
      }
    })

    const userId = user.id

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