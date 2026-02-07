import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'
import { 
	getCoachPlanificationWeeks, 
	canCoachLoadMonthlyPlanifications,
	canCoachLoadUnlimitedPlanifications 
} from '@/lib/coach-plan-features'

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
          },
          targetUser: {
            select: {
              id: true,
              name: true,
              email: true
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
          is_personalized: p.isPersonalized || false,
          target_user_id: p.targetUserId ? String(p.targetUserId) : null,
          target_user: p.targetUser ? {
            id: String(p.targetUser.id),
            name: p.targetUser.name,
            email: p.targetUser.email
          } : null,
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

    // Obtener nivel del query param (para cuando el usuario cambia el filtro)
    const levelIdParam = searchParams.get('levelId')
    let selectedLevelId: number | null = null

    if (levelIdParam) {
      selectedLevelId = parseInt(levelIdParam, 10)
      if (isNaN(selectedLevelId)) {
        selectedLevelId = null
      }
    }

    // Si no hay nivel seleccionado en query param, usar el de preferencias
    const preferredLevelId = selectedLevelId ?? preference?.preferredLevelId ?? null
    const preferredDisciplineId = preference?.preferredDisciplineId ?? null

    // Si no hay disciplina configurada, no podemos mostrar planificaciones
    if (!preferredDisciplineId) {
      return NextResponse.json({ 
        data: null,
        needsPreference: true,
        message: 'El usuario no tiene preferencias configuradas (discipline y level)'
      })
    }

    // Si no hay nivel seleccionado (ni en query ni en preferencias), indicar que se necesita seleccionar
    if (!preferredLevelId) {
      return NextResponse.json({ 
        data: null,
        needsLevel: true,
        disciplineId: preferredDisciplineId,
        message: 'El usuario necesita seleccionar un nivel para ver las planificaciones'
      })
    }

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
    // Usar la misma normalización que al guardar para evitar problemas de zona horaria
    const normalizedDate = normalizeDateForArgentina(dateStr)
    
    // Crear rango para buscar: desde el inicio del día hasta el inicio del día siguiente
    const startOfDay = normalizedDate
    // Calcular el inicio del día siguiente en UTC (sumar 1 día y mantener el mismo offset de 3 horas)
    const [year, month, day] = dateStr.split('-').map(Number)
    const nextDayStr = new Date(year, month - 1, day + 1).toISOString().split('T')[0]
    const endOfDay = normalizeDateForArgentina(nextDayStr)

    // PASO 1: Buscar planificación PERSONALIZADA para este usuario
    const personalizedPlanification = await prisma.planification.findFirst({
      where: {
        coachId: coachId,
        targetUserId: userId,
        isPersonalized: true,
        date: {
          gte: startOfDay,
          lt: endOfDay
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
        isPersonalized: true,
        targetUserId: true,
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
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Si hay personalizada, usarla con prioridad
    let planification = personalizedPlanification

    // PASO 2: Si no hay personalizada, buscar planificación GENERAL
    if (!planification) {
      planification = await prisma.planification.findFirst({
        where: {
          coachId: coachId,
          disciplineId: preferredDisciplineId,
          disciplineLevelId: preferredLevelId,
          isPersonalized: false, // Explícitamente buscar NO personalizadas
          date: {
            gte: startOfDay,
            lt: endOfDay
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
          isPersonalized: true,
          targetUserId: true,
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
    }

    if (!planification) {
      return NextResponse.json({ 
        data: null,
        disciplineId: preferredDisciplineId,
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
      is_personalized: planification.isPersonalized || false,
      target_user_id: planification.targetUserId ? String(planification.targetUserId) : null,
      target_user: (planification as any).targetUser ? {
        id: String((planification as any).targetUser.id),
        name: (planification as any).targetUser.name,
        email: (planification as any).targetUser.email
      } : null,
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

    // Nuevos campos para planificaciones personalizadas
    const isPersonalized = body.is_personalized || false
    const targetUserId = body.target_user_id || null

    // Validación para planificaciones personalizadas
    if (isPersonalized && !targetUserId) {
      return NextResponse.json(
        { error: 'target_user_id es requerido para planificaciones personalizadas' },
        { status: 400 }
      )
    }

    // Si es personalizada, validar que el usuario sea estudiante del coach
    if (isPersonalized && targetUserId) {
      const targetUserIdNum = typeof targetUserId === 'string' ? parseInt(targetUserId, 10) : targetUserId
      
      if (isNaN(targetUserIdNum)) {
        return NextResponse.json(
          { error: 'target_user_id inválido' },
          { status: 400 }
        )
      }

      const relationship = await prisma.coachStudentRelationship.findFirst({
        where: {
          coachId: coachId,
          studentId: targetUserIdNum,
          status: 'active'
        }
      })

      if (!relationship) {
        return NextResponse.json(
          { error: 'El usuario especificado no es tu estudiante' },
          { status: 403 }
        )
      }

      // Validar que no exista ya una planificación personalizada para ese usuario en esa fecha
      const dateStr = typeof body.date === 'string' ? body.date : body.date.toISOString().split('T')[0]
      const normalizedDate = normalizeDateForArgentina(dateStr)
      
      const existingPersonalized = await prisma.planification.findFirst({
        where: {
          coachId: coachId,
          targetUserId: targetUserIdNum,
          isPersonalized: true,
          date: normalizedDate
        }
      })

      if (existingPersonalized) {
        return NextResponse.json(
          { error: 'Ya existe una planificación personalizada para este usuario en esta fecha' },
          { status: 409 }
        )
      }
    }

    // Validar campos requeridos
    // Para personalizadas, disciplina y nivel son opcionales
    if (!isPersonalized) {
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
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'Fecha requerida' },
        { status: 400 }
      )
    }

    // Preparar datos para crear
    const disciplineIdNum = body.discipline_id ? (typeof body.discipline_id === 'string' ? parseInt(body.discipline_id, 10) : body.discipline_id) : null
    const disciplineLevelIdNum = body.discipline_level_id ? (typeof body.discipline_level_id === 'string' ? parseInt(body.discipline_level_id, 10) : body.discipline_level_id) : null

    if (disciplineIdNum && isNaN(disciplineIdNum)) {
      return NextResponse.json(
        { error: 'ID de disciplina inválido' },
        { status: 400 }
      )
    }

    if (disciplineLevelIdNum && isNaN(disciplineLevelIdNum)) {
      return NextResponse.json(
        { error: 'ID de nivel de disciplina inválido' },
        { status: 400 }
      )
    }

    // Normalizar la fecha
    const dateStr = typeof body.date === 'string' ? body.date : body.date.toISOString().split('T')[0]
    const normalizedDate = normalizeDateForArgentina(dateStr)

    // Validar límite de días hacia adelante según el plan del coach
    try {
      const planificationWeeks = await getCoachPlanificationWeeks(coachId)
      const canLoadMonthly = await canCoachLoadMonthlyPlanifications(coachId)
      const canLoadUnlimited = await canCoachLoadUnlimitedPlanifications(coachId)

      // Parsear la fecha de la planificación
      const [year, month, day] = dateStr.split('-').map(Number)
      const planificationDate = new Date(year, month - 1, day)
      
      // Obtener fecha de hoy (sin hora, solo fecha)
      const today = new Date()
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      
      // Calcular diferencia en días
      const diffTime = planificationDate.getTime() - todayDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Validar según el tipo de plan
      if (canLoadUnlimited) {
        // Plan ELITE: sin límite, pero no puede crear en el pasado
        if (diffDays < 0) {
          return NextResponse.json(
            { error: 'No puedes crear planificaciones en el pasado' },
            { status: 403 }
          )
        }
      } else if (canLoadMonthly) {
        // Plan POWER: puede cargar hasta 1 mes adelante
        const maxDays = 30
        if (diffDays < 0) {
          return NextResponse.json(
            { error: 'No puedes crear planificaciones en el pasado' },
            { status: 403 }
          )
        }
        if (diffDays > maxDays) {
          return NextResponse.json(
            { error: `Tu plan solo permite cargar planificaciones hasta ${maxDays} días adelante` },
            { status: 403 }
          )
        }
      } else if (planificationWeeks > 0) {
        // Plan START: solo puede cargar hasta X semanas adelante
        const maxDays = planificationWeeks * 7
        if (diffDays < 0) {
          return NextResponse.json(
            { error: 'No puedes crear planificaciones en el pasado' },
            { status: 403 }
          )
        }
        if (diffDays > maxDays) {
          return NextResponse.json(
            { error: `Tu plan solo permite cargar planificaciones hasta ${planificationWeeks} semana${planificationWeeks !== 1 ? 's' : ''} (${maxDays} días) adelante` },
            { status: 403 }
          )
        }
      } else {
        // Sin plan o plan sin límite de semanas: solo puede cargar para hoy
        if (diffDays !== 0) {
          return NextResponse.json(
            { error: 'Tu plan solo permite cargar planificaciones para el día actual' },
            { status: 403 }
          )
        }
      }
    } catch (planError) {
      // Si hay error al obtener el plan, loguear pero continuar con la creación
      // (para no bloquear si hay un problema temporal con el sistema de planes)
      console.error('Error al validar límite de planificación:', planError)
    }

    // Los bloques se envían como "blocks" pero se guardan en "exercises" (campo JSON)
    const exercisesData = body.blocks || body.exercises || null

    // Crear la planificación
    const targetUserIdNum = targetUserId ? (typeof targetUserId === 'string' ? parseInt(targetUserId, 10) : targetUserId) : null
    
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
        isCompleted: body.is_completed || false,
        isPersonalized: isPersonalized,
        targetUserId: targetUserIdNum
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
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true
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
      discipline_id: created.disciplineId ? String(created.disciplineId) : null,
      discipline_level_id: created.disciplineLevelId ? String(created.disciplineLevelId) : null,
      date: normalizedDateString,
      title: created.title,
      description: created.description,
      blocks: blocksData,
      exercises: exercisesDataResponse,
      notes: created.notes,
      is_active: !created.isCompleted,
      is_completed: created.isCompleted,
      is_personalized: created.isPersonalized || false,
      target_user_id: created.targetUserId ? String(created.targetUserId) : null,
      target_user: created.targetUser ? {
        id: String(created.targetUser.id),
        name: created.targetUser.name,
        email: created.targetUser.email
      } : null,
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