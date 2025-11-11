import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach } from '@/lib/auth-helpers'

// GET /api/planifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach y obtener su coachId
    const authCheck = await isCoach(session.user.id)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado. Solo coaches pueden ver planificaciones.' }, { status: 403 })
    }

    const coachId = authCheck.profile.id

    const planifications = await prisma.planification.findMany({
      where: { coachId: coachId },
      include: {
        discipline: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        disciplineLevel: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Transformar para respuesta
    const transformed = planifications.map(p => ({
      ...p,
      discipline: p.discipline ? {
        id: p.discipline.id,
        name: p.discipline.name,
        color: p.discipline.color
      } : null,
      discipline_level: p.disciplineLevel ? {
        id: p.disciplineLevel.id,
        name: p.disciplineLevel.name,
        description: p.disciplineLevel.description
      } : null
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching planifications:', error)
    return NextResponse.json(
      { error: 'Error al cargar planificaciones' },
      { status: 500 }
    )
  }
}

// POST /api/planifications
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(session.user.id)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id

    const body = await request.json()
    const { discipline_id, discipline_level_id, date, title, description, exercises, notes, is_completed } = body

    if (!discipline_id || !discipline_level_id || !date) {
      return NextResponse.json(
        { error: 'Campos requeridos: discipline_id, discipline_level_id, date' },
        { status: 400 }
      )
    }

    const newPlanification = await prisma.planification.create({
      data: {
        coachId: coachId, // ID del perfil del coach (consistente con otras tablas)
        // userId no se incluye - las planificaciones son libres del coach
        disciplineId: discipline_id || null,
        disciplineLevelId: discipline_level_id || null,
        date: new Date(date),
        title: title || null,
        description: description || null,
        exercises: exercises || null,
        notes: notes || null,
        isCompleted: is_completed !== undefined ? is_completed : false
      } as any,
      include: {
        discipline: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        disciplineLevel: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    // Transformar para respuesta
    const transformed = {
      ...newPlanification,
      discipline: (newPlanification as any).discipline ? {
        id: (newPlanification as any).discipline.id,
        name: (newPlanification as any).discipline.name,
        color: (newPlanification as any).discipline.color
      } : null,
      discipline_level: (newPlanification as any).disciplineLevel ? {
        id: (newPlanification as any).disciplineLevel.id,
        name: (newPlanification as any).disciplineLevel.name,
        description: (newPlanification as any).disciplineLevel.description
      } : null
    }

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error creating planification:', error)
    return NextResponse.json(
      { error: 'Error al crear planificación' },
      { status: 500 }
    )
  }
}