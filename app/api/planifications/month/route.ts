import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/planifications/month?year=2024&month=1
// Obtiene las planificaciones del mes:
// - Si el estudiante tiene personalizedWorkouts=true: solo sus planificaciones personalizadas
// - Si no: planificaciones generales según sus preferencias (discipline y level)
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
        data: [],
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

    // Verificar si el estudiante tiene feature de planificaciones personalizadas
    const studentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: 'active'
      },
      include: {
        plan: {
          select: {
            features: true
          }
        }
      }
    })

    // Parsear features
    let hasPersonalizedWorkouts = false
    const rawFeatures = studentSubscription?.plan?.features
    if (typeof rawFeatures === 'string') {
      try {
        const parsed = JSON.parse(rawFeatures)
        hasPersonalizedWorkouts = parsed?.personalizedWorkouts === true
      } catch (e) {
        console.error('Error parsing features:', e)
      }
    } else if (rawFeatures && typeof rawFeatures === 'object') {
      hasPersonalizedWorkouts = (rawFeatures as any)?.personalizedWorkouts === true
    }

    // Obtener año y mes de los query params
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')
    const disciplineIdParam = searchParams.get('disciplineId')
    
    const now = new Date()
    const year = yearParam ? parseInt(yearParam) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1

    // Calcular el primer y último día del mes en UTC
    // Usar UTC para evitar problemas de zona horaria en las consultas
    // El primer día del mes en Argentina (UTC-3) = 03:00 UTC del mismo día
    const firstDay = new Date(Date.UTC(year, month - 1, 1, 3, 0, 0, 0))
    // El último día del mes: día 1 del mes siguiente a las 02:59:59 UTC (que es 23:59:59 del último día en Argentina)
    const lastDay = new Date(Date.UTC(year, month, 1, 2, 59, 59, 999))

    // Construir el filtro de where
    const whereClause: any = {
      coachId: coachId, // Solo planificaciones del coach del estudiante
      date: {
        gte: firstDay,
        lte: lastDay
      }
    }

    // Si tiene personalizedWorkouts, buscar solo planificaciones personalizadas para él
    if (hasPersonalizedWorkouts) {
      whereClause.isPersonalized = true
      whereClause.targetUserId = userId
    } else {
      // Si no tiene el feature, buscar planificaciones generales según preferencias
      // Determinar qué disciplina usar:
      // 1. Si se proporciona disciplineId en los params, usar ese
      // 2. Si no, usar la preferencia del usuario si existe
      // 3. Si no hay preferencia, no filtrar por disciplina (mostrar todas)
      let disciplineIdToUse: number | null = null
      
      if (disciplineIdParam) {
        const disciplineId = parseInt(disciplineIdParam, 10)
        if (!isNaN(disciplineId)) {
          disciplineIdToUse = disciplineId
        }
      } else if (preference?.preferredDisciplineId) {
        disciplineIdToUse = preference.preferredDisciplineId
      }

      // Si tenemos una disciplina, filtrar por ella
      if (disciplineIdToUse !== null) {
        whereClause.disciplineId = disciplineIdToUse
        // También filtrar por nivel si el usuario tiene preferencia de nivel
        if (preference?.preferredLevelId) {
          whereClause.disciplineLevelId = preference.preferredLevelId
        }
      }
    }

    // Buscar todas las planificaciones del coach del estudiante según el filtro
    const planifications = await prisma.planification.findMany({
      where: whereClause,
      select: {
        date: true
      },
      orderBy: { date: 'asc' }
    })

    // Extraer solo las fechas (días del mes) que tienen planificación
    // Usar UTC para evitar problemas de zona horaria al leer las fechas
    const datesWithPlanification = planifications
      .map((p) => {
        const date = new Date(p.date)
        // Usar métodos UTC para obtener año, mes y día sin problemas de timezone
        const dateYear = date.getUTCFullYear()
        const dateMonth = date.getUTCMonth() + 1
        const dateDay = date.getUTCDate()
        
        // Verificar que la fecha pertenezca al mes y año correcto
        if (dateYear === year && dateMonth === month) {
          return dateDay // Retornar solo el día del mes (1-31)
        }
        return null
      })
      .filter((day): day is number => day !== null)

    return NextResponse.json({ 
      data: datesWithPlanification,
      month,
      year
    })
  } catch (error) {
    console.error('Error fetching month planifications:', error)
    return NextResponse.json(
      { error: 'Error al cargar las planificaciones del mes' },
      { status: 500 }
    )
  }
}