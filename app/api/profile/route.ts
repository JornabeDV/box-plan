import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Nota: La tabla profiles no existe en el schema, usar User directamente
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // Transformar a formato de profile
      const profile = user ? {
        id: user.id,
        full_name: user.name || user.email,
        avatar_url: user.image,
        phone: user.phone,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      } : null

      return NextResponse.json(profile)
    } catch (dbError: any) {
      // Si hay error de DB, loguear y devolver null
      console.error('Database error fetching profile:', dbError?.message || dbError)
      return NextResponse.json(null)
    }
  } catch (error: any) {
    console.error('Error fetching profile:', error?.message || error)
    // En caso de error desconocido, devolver null en lugar de error 500
    // para permitir que la app funcione
    return NextResponse.json(null)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, avatar_url, phone, current_password, new_password } = body

    // Preparar datos de actualización
    const updateData: any = {}
    if (full_name !== undefined) updateData.name = full_name
    if (avatar_url !== undefined) updateData.image = avatar_url
    if (phone !== undefined) updateData.phone = phone

    // Si viene cambio de contraseña, validar y hashear
    if (current_password !== undefined || new_password !== undefined) {
      if (!current_password || !new_password) {
        return NextResponse.json({ error: 'Debes ingresar la contraseña actual y la nueva' }, { status: 400 })
      }

      const trimmedNew = new_password.trim()
      if (trimmedNew.length < 6) {
        return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      }

      // Obtener contraseña actual hasheada
      const userWithPassword = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      })

      if (!userWithPassword) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }

      const valid = await bcrypt.compare(current_password, userWithPassword.password)
      if (!valid) {
        return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
      }

      updateData.password = await bcrypt.hash(trimmedNew, 10)
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    // Actualizar usuario
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Transformar a formato de profile
    const profile = {
      id: user.id,
      full_name: user.name || user.email,
      avatar_url: user.image,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}