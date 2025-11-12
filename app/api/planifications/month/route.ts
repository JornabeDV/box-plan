import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/planifications/month?year=2024&month=1
// Obtiene todas las planificaciones del mes del coach del estudiante según sus preferencias (discipline y level)
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

    if (!preference || !preference.preferredDisciplineId || !preference.preferredLevelId) {
      return NextResponse.json({ 
        data: [],
        message: 'El usuario no tiene preferencias configuradas (discipline y level)'
      })
    }

    const { preferredDisciplineId, preferredLevelId } = preference

    // Obtener año y mes de los query params
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')
    
    const now = new Date()
    const year = yearParam ? parseInt(yearParam) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1

    // Calcular el primer y último día del mes
    const firstDay = new Date(year, month - 1, 1)
    firstDay.setHours(0, 0, 0, 0)
    const lastDay = new Date(year, month, 0)
    lastDay.setHours(23, 59, 59, 999)

    // Buscar todas las planificaciones del coach del estudiante según sus preferencias
    const planifications = await prisma.planification.findMany({
      where: {
        coachId: coachId, // Solo planificaciones del coach del estudiante
        disciplineId: preferredDisciplineId,
        disciplineLevelId: preferredLevelId,
        date: {
          gte: firstDay,
          lte: lastDay
        }
      },
      select: {
        date: true
      },
      orderBy: { date: 'asc' }
    })

    // Extraer solo las fechas (días del mes) que tienen planificación
    const datesWithPlanification = planifications
      .map((p) => {
        const date = new Date(p.date)
        // Verificar que la fecha pertenezca al mes y año correcto
        if (date.getFullYear() === year && date.getMonth() + 1 === month) {
          return date.getDate() // Retornar solo el día del mes (1-31)
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