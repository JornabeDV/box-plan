import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'

// GET /api/planifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach y obtener su coachId
    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado. Solo coaches pueden ver planificaciones.' }, { status: 403 })
    }

    const coachId = authCheck.profile.id

    const planifications = await prisma.planification.findMany({
      where: { coachId: coachId },
      select: {
        id: true,
        disciplineId: true,
        disciplineLevelId: true,
        coachId: true,
        date: true,
        title: true,
        description: true,
        exercises: true,
        notes: true,
        isCompleted: true,
        createdAt: true,
        updatedAt: true,
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
    // Convertir "exercises" (JSON) a "blocks" para el frontend
    const transformed = planifications.map(p => {
      const exercisesData = (p as any).exercises
      const blocksData = exercisesData ? (Array.isArray(exercisesData) ? exercisesData : []) : []
      
      return {
        ...p,
        blocks: blocksData, // Agregar blocks para compatibilidad con el frontend
        exercises: exercisesData, // Mantener exercises también
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
      }
    })

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
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id

    const body = await request.json()
    const { discipline_id, discipline_level_id, date, title, description, exercises, blocks, notes, is_completed, estimated_duration } = body

    if (!discipline_id || !discipline_level_id || !date) {
      return NextResponse.json(
        { error: 'Campos requeridos: discipline_id, discipline_level_id, date' },
        { status: 400 }
      )
    }

    // Convertir discipline_id y discipline_level_id a números enteros
    const disciplineIdNum = typeof discipline_id === 'string' ? parseInt(discipline_id, 10) : discipline_id
    const disciplineLevelIdNum = typeof discipline_level_id === 'string' ? parseInt(discipline_level_id, 10) : discipline_level_id

    if (isNaN(disciplineIdNum) || isNaN(disciplineLevelIdNum)) {
      return NextResponse.json(
        { error: 'discipline_id y discipline_level_id deben ser números válidos' },
        { status: 400 }
      )
    }

    // Normalizar la fecha para Argentina (UTC-3) para evitar problemas de timezone
    const normalizedDate = typeof date === 'string' 
      ? normalizeDateForArgentina(date)
      : new Date(date)

    // Los bloques se envían como "blocks" pero se guardan en "exercises" (campo JSON)
    // Priorizar "blocks" sobre "exercises" si ambos están presentes
    const blocksToSave = blocks || exercises || null

    const newPlanification = await prisma.planification.create({
      data: {
        coachId: coachId, // ID del perfil del coach (consistente con otras tablas)
        // userId no se incluye - las planificaciones son libres del coach
        disciplineId: disciplineIdNum || null,
        disciplineLevelId: disciplineLevelIdNum || null,
        date: normalizedDate,
        title: title || null,
        description: description || null,
        exercises: blocksToSave ? JSON.parse(JSON.stringify(blocksToSave)) : null, // Asegurar que sea JSON válido
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
    // Convertir "exercises" (JSON) a "blocks" para el frontend
    const exercisesData = (newPlanification as any).exercises
    const blocksData = exercisesData ? (Array.isArray(exercisesData) ? exercisesData : []) : []

    const transformed = {
      ...newPlanification,
      blocks: blocksData, // Agregar blocks para compatibilidad con el frontend
      exercises: exercisesData, // Mantener exercises también
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