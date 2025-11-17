import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

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
    const { searchParams } = new URL(request.url)
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
    // Usar UTC para evitar problemas de zona horaria
    // Parsear la fecha manualmente y crear en UTC
    const [year, month, day] = dateStr.split('-').map(Number)
    // Crear la fecha representando el inicio del día en Argentina (UTC-3) = 03:00 UTC
    const targetDate = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0))
    // El siguiente día: día siguiente a las 02:59:59 UTC (que es 23:59:59 del día actual en Argentina)
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59, 999))

    const planification = await prisma.planification.findFirst({
      where: {
        coachId: coachId, // Solo planificaciones del coach del estudiante
        disciplineId: preferredDisciplineId,
        disciplineLevelId: preferredLevelId,
        date: {
          gte: targetDate,
          lt: nextDay
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
    const transformed = {
      ...planification,
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
    console.error('Error fetching today planification:', error)
    return NextResponse.json(
      { error: 'Error al cargar la planificación de hoy' },
      { status: 500 }
    )
  }
}