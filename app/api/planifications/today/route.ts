import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/planifications/today?date=YYYY-MM-DD
// Obtiene la planificación de una fecha específica (o hoy si no se proporciona) del coach del estudiante según sus preferencias (discipline y level)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

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

    // Obtener las disciplinas del usuario (nuevo modelo)
    const userDisciplines = await prisma.userDiscipline.findMany({
      where: { userId },
      include: {
        discipline: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        level: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Si no tiene disciplinas asignadas, usar preferencias antiguas como fallback
    const preference = userDisciplines.length === 0 
      ? await prisma.userPreference.findUnique({
          where: { userId },
          select: {
            preferredDisciplineId: true,
            preferredLevelId: true
          }
        })
      : null

    // Si tampoco hay preferencias antiguas, no podemos mostrar planificaciones
    if (userDisciplines.length === 0 && !preference?.preferredDisciplineId) {
      return NextResponse.json({ 
        data: null,
        needsPreference: true,
        message: 'El usuario no tiene disciplinas asignadas'
      })
    }

    // Obtener nivel del query param (para filtrar por disciplina específica)
    const { searchParams } = new URL(request.url)
    const disciplineIdParam = searchParams.get('disciplineId')
    const levelIdParam = searchParams.get('levelId')
    
    let selectedDisciplineId: number | null = null
    let selectedLevelId: number | null = null

    if (disciplineIdParam) {
      selectedDisciplineId = parseInt(disciplineIdParam, 10)
      if (isNaN(selectedDisciplineId)) {
        selectedDisciplineId = null
      }
    }

    if (levelIdParam) {
      selectedLevelId = parseInt(levelIdParam, 10)
      if (isNaN(selectedLevelId)) {
        selectedLevelId = null
      }
    }

    // Preparar lista de combinaciones disciplina/nivel a buscar
    let disciplineLevelCombinations: { disciplineId: number; levelId: number | null }[] = []

    if (selectedDisciplineId) {
      // Si se especificó una disciplina en particular, buscar esa
      const userDiscipline = userDisciplines.find(ud => ud.disciplineId === selectedDisciplineId)
      disciplineLevelCombinations = [{
        disciplineId: selectedDisciplineId,
        levelId: selectedLevelId ?? userDiscipline?.levelId ?? null
      }]
    } else if (userDisciplines.length > 0) {
      // Buscar en todas las disciplinas del usuario
      disciplineLevelCombinations = userDisciplines.map(ud => ({
        disciplineId: ud.disciplineId,
        levelId: ud.levelId
      }))
    } else if (preference) {
      // Fallback a preferencias antiguas
      disciplineLevelCombinations = [{
        disciplineId: preference.preferredDisciplineId!,
        levelId: preference.preferredLevelId
      }]
    }

    // Filtrar combinaciones que no tengan nivel asignado
    const validCombinations = disciplineLevelCombinations.filter(
      c => c.levelId !== null
    )

    if (validCombinations.length === 0) {
      return NextResponse.json({ 
        data: null,
        needsLevel: true,
        message: 'El usuario necesita tener niveles asignados a sus disciplinas para ver las planificaciones'
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

    console.log('Searching planifications:', {
      dateStr,
      coachId,
      validCombinations,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    })

    // Buscar planificaciones para CUALQUIERA de las disciplinas/niveles del usuario
    const planifications = await prisma.planification.findMany({
      where: {
        coachId: coachId,
        date: {
          gte: startOfDay,
          lt: endOfDay
        },
        OR: validCombinations.map(combo => ({
          disciplineId: combo.disciplineId,
          disciplineLevelId: combo.levelId
        }))
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
      orderBy: [
        { discipline: { orderIndex: 'asc' } },
        { disciplineLevel: { orderIndex: 'asc' } }
      ]
    })

    console.log('Planifications found:', planifications.length)
    
    if (planifications.length === 0) {
      // Intentar buscar sin filtros de disciplina y nivel para debug
      const allPlanifications = await prisma.planification.findMany({
        where: {
          coachId: coachId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        select: {
          id: true,
          disciplineId: true,
          disciplineLevelId: true,
          date: true
        }
      })
      
      console.log('All planifications for date:', allPlanifications)
      
      return NextResponse.json({ 
        data: [],
        message: `No hay planificaciones para ${dateParam ? 'esa fecha' : 'hoy'} con tus disciplinas y niveles`
      })
    }

    // Transformar para respuesta
    const transformed = planifications.map(planification => {
      const exercisesData = (planification as any).exercises
      const blocksData = exercisesData ? (Array.isArray(exercisesData) ? exercisesData : []) : []

      return {
        ...planification,
        blocks: blocksData,
        exercises: exercisesData,
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
    })

    return NextResponse.json({ data: transformed })
  } catch (error) {
    console.error('Error fetching today planification:', error)
    return NextResponse.json(
      { error: 'Error al cargar la planificación de hoy' },
      { status: 500 }
    )
  }
}