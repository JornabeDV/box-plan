import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Nota: La tabla profiles no existe en el schema, usar User directamente
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // Transformar a formato de profile
      const profile = user ? {
        id: user.id,
        full_name: user.name || user.email,
        avatar_url: user.image,
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
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, avatar_url } = body

    // Preparar datos de actualización
    const updateData: any = {}
    if (full_name !== undefined) updateData.name = full_name
    if (avatar_url !== undefined) updateData.image = avatar_url
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    // Actualizar usuario
    const user = await prisma.user.update({
      where: { id: session.user.id },
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