import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

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
        coachId: parseInt(coachId, 10),
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

    // Transformar disciplinas al formato esperado por el frontend
    const disciplinesWithLevels = disciplines.map(discipline => ({
      id: String(discipline.id),
      name: discipline.name,
      description: discipline.description || undefined,
      color: discipline.color,
      order_index: discipline.orderIndex,
      is_active: discipline.isActive,
      coach_id: String(discipline.coachId),
      created_at: discipline.createdAt.toISOString(),
      updated_at: discipline.updatedAt.toISOString(),
      levels: discipline.levels.map(level => ({
        id: String(level.id),
        discipline_id: String(level.disciplineId),
        name: level.name,
        description: level.description || undefined,
        order_index: level.orderIndex,
        is_active: level.isActive,
        created_at: level.createdAt.toISOString(),
        updated_at: level.updatedAt.toISOString()
      }))
    }))

    // Extraer niveles para respuesta separada
    const levels = disciplinesWithLevels.flatMap(d => d.levels || [])

    const response = NextResponse.json({ disciplines: disciplinesWithLevels, levels })
    
    // Agregar caché para reducir queries repetidas
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=15')
    
    return response
  } catch (error) {
    console.error('Error fetching disciplines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/disciplines
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, coach_id, order_index, levels } = body

    // Usar coach_id del body o el ID del perfil del coach
    const profileId = coach_id || (authCheck.profile as any).id
    
    // Asegurar que coachId sea un número entero
    const coachIdNumber = typeof profileId === 'string' ? parseInt(profileId, 10) : profileId
    
    if (isNaN(coachIdNumber)) {
      return NextResponse.json({ error: 'Invalid coach ID' }, { status: 400 })
    }

    // Crear disciplina con niveles en una transacción
    const newDiscipline = await prisma.discipline.create({
      data: {
        name,
        description: description || null,
        color: color || '#3B82F6',
        coachId: coachIdNumber,
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
        levels: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    // Transformar al formato esperado por el frontend
    const transformedDiscipline = {
      id: String(newDiscipline.id),
      name: newDiscipline.name,
      description: newDiscipline.description || undefined,
      color: newDiscipline.color,
      order_index: newDiscipline.orderIndex,
      is_active: newDiscipline.isActive,
      coach_id: String(newDiscipline.coachId),
      created_at: newDiscipline.createdAt.toISOString(),
      updated_at: newDiscipline.updatedAt.toISOString(),
      levels: newDiscipline.levels.map(level => ({
        id: String(level.id),
        discipline_id: String(level.disciplineId),
        name: level.name,
        description: level.description || undefined,
        order_index: level.orderIndex,
        is_active: level.isActive,
        created_at: level.createdAt.toISOString(),
        updated_at: level.updatedAt.toISOString()
      }))
    }

    return NextResponse.json(transformedDiscipline)
  } catch (error) {
    console.error('Error creating discipline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}