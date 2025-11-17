import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user-preferences/[userId]
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preference = await prisma.userPreference.findUnique({
      where: { userId: parseInt(params.userId) },
      include: {
        // Nota: Como no hay foreign keys, necesitamos cargar manualmente
      }
    })

    if (!preference) {
      return NextResponse.json(null)
    }

    // Cargar disciplina y nivel si existen
    const discipline = preference.preferredDisciplineId 
      ? await prisma.discipline.findUnique({
          where: { id: preference.preferredDisciplineId },
          select: { id: true, name: true, color: true }
        })
      : null

    const level = preference.preferredLevelId
      ? await prisma.disciplineLevel.findUnique({
          where: { id: preference.preferredLevelId },
          select: { id: true, name: true, description: true }
        })
      : null

    // Transformar para respuesta
    const result = {
      ...preference,
      discipline_id: discipline?.id || null,
      discipline_name: discipline?.name || null,
      discipline_color: discipline?.color || null,
      level_id: level?.id || null,
      level_name: level?.name || null,
      level_description: level?.description || null
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/user-preferences/[userId]
export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preferred_discipline_id, preferred_level_id } = body
    const userId = parseInt(params.userId)

    // Convertir preferred_discipline_id y preferred_level_id a números enteros
    const preferredDisciplineIdNum = preferred_discipline_id 
      ? parseInt(String(preferred_discipline_id), 10)
      : null
    
    const preferredLevelIdNum = preferred_level_id
      ? parseInt(String(preferred_level_id), 10)
      : null

    // Validar que los valores convertidos sean números válidos
    if (preferredDisciplineIdNum !== null && isNaN(preferredDisciplineIdNum)) {
      return NextResponse.json(
        { error: 'preferred_discipline_id debe ser un número válido' },
        { status: 400 }
      )
    }

    if (preferredLevelIdNum !== null && isNaN(preferredLevelIdNum)) {
      return NextResponse.json(
        { error: 'preferred_level_id debe ser un número válido' },
        { status: 400 }
      )
    }

    // Usar upsert para crear o actualizar
    const result = await prisma.userPreference.upsert({
      where: { userId },
      update: {
        preferredDisciplineId: preferredDisciplineIdNum,
        preferredLevelId: preferredLevelIdNum
      },
      create: {
        userId,
        preferredDisciplineId: preferredDisciplineIdNum,
        preferredLevelId: preferredLevelIdNum
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/user-preferences/[userId]
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.userPreference.delete({
      where: { userId: parseInt(params.userId) }
    }).catch(() => {
      // Si no existe, no es un error
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}