import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach } from '@/lib/auth-helpers'

// GET /api/disciplines?coachId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get('coachId')

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID required' }, { status: 400 })
    }

    // Cargar disciplinas con sus niveles
    const disciplines = await prisma.discipline.findMany({
      where: {
        coachId: parseInt(coachId),
        isActive: true
      },
      include: {
        levels: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    })

    if (disciplines.length === 0) {
      return NextResponse.json({ disciplines: [], levels: [] })
    }

    // Extraer niveles para respuesta separada
    const levels = disciplines.flatMap(d => d.levels)

    // Combinar disciplinas con sus niveles
    const disciplinesWithLevels = disciplines.map(discipline => ({
      ...discipline,
      levels: discipline.levels
    }))

    return NextResponse.json({ disciplines: disciplinesWithLevels, levels })
  } catch (error) {
    console.error('Error fetching disciplines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/disciplines
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(session.user.id)
    if (!authCheck.isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, coach_id, order_index, levels } = body

    // Usar coach_id del body o el ID del perfil del coach
    const profileId = coach_id || (authCheck.profile as any).id

    // Crear disciplina con niveles en una transacción
    const newDiscipline = await prisma.discipline.create({
      data: {
        name,
        description: description || null,
        color: color || '#3B82F6',
        coachId: profileId,
        orderIndex: order_index || 0,
        levels: levels && levels.length > 0 ? {
          create: levels.map((level: any) => ({
            name: level.name,
            description: level.description || null,
            orderIndex: level.order_index || 0
          }))
        } : undefined
      },
      include: {
        levels: true
      }
    })

    return NextResponse.json(newDiscipline)
  } catch (error) {
    console.error('Error creating discipline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}