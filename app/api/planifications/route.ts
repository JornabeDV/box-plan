import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/planifications?date=YYYY-MM-DD
// GET /api/planifications?coachId=123 (para coaches)
// Obtiene la planificación de una fecha específica (o hoy si no se proporciona) del coach del estudiante según sus preferencias (discipline y level)
// O si se proporciona coachId, obtiene todas las planificaciones del coach
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const coachIdParam = searchParams.get('coachId')

    // Si se proporciona coachId, es una petición del admin dashboard (coach)
    if (coachIdParam) {
      // Verificar que el usuario es coach
      const authCheck = await isCoach(userId)
      if (!authCheck.isAuthorized || !authCheck.profile) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      const coachId = parseInt(coachIdParam, 10)
      if (isNaN(coachId) || coachId !== authCheck.profile.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      // Obtener todas las planificaciones del coach
      const planifications = await prisma.planification.findMany({
        where: {
          coachId: coachId
        },
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
        orderBy: {
          date: 'desc'
        }
      })

      // Transformar para respuesta
      const transformed = planifications.map(p => {
        const exercisesData = (p as any).exercises
        const blocksData = exercisesData ? (Array.isArray(exercisesData) ? exercisesData : []) : []

        // Normalizar fecha usando métodos locales para evitar problemas de zona horaria
        const dateObj = p.date instanceof Date ? p.date : new Date(p.date)
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        const normalizedDate = `${year}-${month}-${day}`

        return {
          id: String(p.id),
          coach_id: String(p.coachId),
          discipline_id: p.disciplineId ? String(p.disciplineId) : null,
          discipline_level_id: p.disciplineLevelId ? String(p.disciplineLevelId) : null,
          date: normalizedDate,
          title: p.title,
          description: p.description,
          blocks: blocksData,
          exercises: exercisesData,
          notes: p.notes,
          is_active: !p.isCompleted,
          is_completed: p.isCompleted,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
          discipline: p.discipline ? {
            id: String(p.discipline.id),
            name: p.discipline.name,
            color: p.discipline.color
          } : null,
          discipline_level: p.disciplineLevel ? {
            id: String(p.disciplineLevel.id),
            name: p.disciplineLevel.name,
            description: p.disciplineLevel.description
          } : null
        }
      })

      return NextResponse.json(transformed)
    }

    // Caso original: estudiante obteniendo planificación de su coach
    // Obtener el coach del estudiante
    const relationship = await prisma.coachStudentRelationship.findFirst({
      where: {
        studentId: userId,
        status: 'active'
      },
      include: {
        coach: {
          select: {
            id: true
          }
        }
      }
    })

    if (!relationship) {
      return NextResponse.json({ 
        data: null,
        message: 'El usuario no está asociado a ningún coach activo'
      })
    }

    const coachId = relationship.coach.id

    // Obtener las preferencias del usuario
    const preference = await prisma.userPreference.findUnique({
      where: { userId },
      select: {
        preferredDisciplineId: true,
        preferredLevelId: true
      }
    })

    if (!preference || !preference.preferredDisciplineId || !preference.preferredLevelId) {
      return NextResponse.json({ 
        data: null,
        message: 'El usuario no tiene preferencias configuradas (discipline y level)'
      })
    }

    const { preferredDisciplineId, preferredLevelId } = preference

    // Obtener la fecha del query param o usar hoy
    const dateParam = searchParams.get('date')
    
    let dateStr: string
    if (dateParam) {
      // Validar formato YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(dateParam)) {
        dateStr = dateParam
      } else {
        // Si el formato no es válido, usar hoy
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${day}`
      }
    } else {
      // Usar hoy - formatear manualmente para evitar problemas de timezone
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      dateStr = `${year}-${month}-${day}`
    }
    
    // Buscar planificaciones activas para la fecha especificada
    // Crear fechas para el inicio y fin del día en hora local
    const [year, month, day] = dateStr.split('-').map(Number)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)

    const planification = await prisma.planification.findFirst({
      where: {
        coachId: coachId,
        disciplineId: preferredDisciplineId,
        disciplineLevelId: preferredLevelId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
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

    if (!planification) {
      return NextResponse.json({ 
        data: null,
        message: `No hay planificación para ${dateParam ? 'esa fecha' : 'hoy'} con tu disciplina y nivel`
      })
    }

    // Transformar para respuesta
    // Convertir "exercises" (JSON) a "blocks" para el frontend
    const exercisesData = (planification as any).exercises
    const blocksData = exercisesData ? (Array.isArray(exercisesData) ? exercisesData : []) : []

    const transformed = {
      ...planification,
      blocks: blocksData, // Agregar blocks para compatibilidad con el frontend
      exercises: exercisesData, // Mantener exercises también
      discipline: planification.discipline ? {
        id: planification.discipline.id,
        name: planification.discipline.name,
        color: planification.discipline.color
      } : null,
      discipline_level: planification.disciplineLevel ? {
        id: planification.disciplineLevel.id,
        name: planification.disciplineLevel.name,
        description: planification.disciplineLevel.description
      } : null
    }

    return NextResponse.json({ data: transformed })
  } catch (error) {
    console.error('Error fetching planification:', error)
    return NextResponse.json(
      { error: 'Error al cargar la planificación' },
      { status: 500 }
    )
  }
}

// POST /api/planifications
// Crea una nueva planificación (solo para coaches)
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
      return NextResponse.json({ error: 'No autorizado. Solo coaches pueden crear planificaciones.' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const body = await request.json()

    // Validar campos requeridos
    if (!body.discipline_id) {
      return NextResponse.json(
        { error: 'ID de disciplina requerido' },
        { status: 400 }
      )
    }

    if (!body.discipline_level_id) {
      return NextResponse.json(
        { error: 'ID de nivel de disciplina requerido' },
        { status: 400 }
      )
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'Fecha requerida' },
        { status: 400 }
      )
    }

    // Preparar datos para crear
    const disciplineIdNum = typeof body.discipline_id === 'string' ? parseInt(body.discipline_id, 10) : body.discipline_id
    const disciplineLevelIdNum = typeof body.discipline_level_id === 'string' ? parseInt(body.discipline_level_id, 10) : body.discipline_level_id

    if (isNaN(disciplineIdNum) || isNaN(disciplineLevelIdNum)) {
      return NextResponse.json(
        { error: 'IDs de disciplina o nivel inválidos' },
        { status: 400 }
      )
    }

    // Normalizar la fecha
    const dateStr = typeof body.date === 'string' ? body.date : body.date.toISOString().split('T')[0]
    const normalizedDate = normalizeDateForArgentina(dateStr)

    // Los bloques se envían como "blocks" pero se guardan en "exercises" (campo JSON)
    const exercisesData = body.blocks || body.exercises || null

    // Crear la planificación
    const created = await prisma.planification.create({
      data: {
        coachId: coachId,
        disciplineId: disciplineIdNum,
        disciplineLevelId: disciplineLevelIdNum,
        date: normalizedDate,
        title: body.title || null,
        description: body.description || null,
        exercises: exercisesData ? JSON.parse(JSON.stringify(exercisesData)) : null,
        notes: body.notes || null,
        isCompleted: body.is_completed || false
      },
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
    const exercisesDataResponse = (created as any).exercises
    const blocksData = exercisesDataResponse ? (Array.isArray(exercisesDataResponse) ? exercisesDataResponse : []) : []

    // Normalizar fecha usando métodos locales para evitar problemas de zona horaria
    const dateObj = created.date instanceof Date ? created.date : new Date(created.date)
    const responseYear = dateObj.getFullYear()
    const responseMonth = String(dateObj.getMonth() + 1).padStart(2, '0')
    const responseDay = String(dateObj.getDate()).padStart(2, '0')
    const normalizedDateString = `${responseYear}-${responseMonth}-${responseDay}`

    const transformed = {
      id: String(created.id),
      coach_id: String(created.coachId),
      discipline_id: String(created.disciplineId),
      discipline_level_id: String(created.disciplineLevelId),
      date: normalizedDateString,
      title: created.title,
      description: created.description,
      blocks: blocksData,
      exercises: exercisesDataResponse,
      notes: created.notes,
      is_active: !created.isCompleted,
      is_completed: created.isCompleted,
      created_at: created.createdAt.toISOString(),
      updated_at: created.updatedAt.toISOString(),
      discipline: created.discipline ? {
        id: String(created.discipline.id),
        name: created.discipline.name,
        color: created.discipline.color
      } : null,
      discipline_level: created.disciplineLevel ? {
        id: String(created.disciplineLevel.id),
        name: created.disciplineLevel.name,
        description: created.disciplineLevel.description
      } : null
    }

    return NextResponse.json(transformed, { status: 201 })
  } catch (error: any) {
    console.error('Error creating planification:', error)
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Disciplina o nivel no encontrado' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear planificación' },
      { status: 500 }
    )
  }
}