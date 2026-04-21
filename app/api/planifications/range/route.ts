import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/planifications/range?start=YYYY-MM-DD&end=YYYY-MM-DD
// Obtiene las planificaciones con título y estado para un rango de fechas
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: 'start y end son requeridos' },
        { status: 400 }
      )
    }

    // Obtener el coach del estudiante
    const relationship = await prisma.coachStudentRelationship.findFirst({
      where: { studentId: userId, status: 'active' },
      include: { coach: { select: { id: true } } }
    })

    if (!relationship) {
      return NextResponse.json({ data: [] })
    }

    const coachId = relationship.coach.id

    // Obtener disciplinas y preferencias del usuario (alineado con /api/planifications/month)
    const userDisciplines = await prisma.userDiscipline.findMany({
      where: { userId }
    })

    const preference = await prisma.userPreference.findUnique({
      where: { userId },
      select: { preferredDisciplineId: true, preferredLevelId: true }
    })

    // Normalizar fechas
    const startDate = normalizeDateForArgentina(startParam)
    const [endYear, endMonth, endDay] = endParam.split('-').map(Number)
    const nextDayStr = new Date(endYear, endMonth - 1, endDay + 1).toISOString().split('T')[0]
    const endOfDay = normalizeDateForArgentina(nextDayStr)

    // Verificar si tiene planificaciones personalizadas
    const studentSubscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: { select: { features: true } } }
    })

    let hasPersonalizedWorkouts = false
    const rawFeatures = studentSubscription?.plan?.features
    if (typeof rawFeatures === 'string') {
      try {
        hasPersonalizedWorkouts = JSON.parse(rawFeatures)?.personalizedWorkouts === true
      } catch {}
    } else if (rawFeatures && typeof rawFeatures === 'object') {
      hasPersonalizedWorkouts = (rawFeatures as any)?.personalizedWorkouts === true
    }

    const whereClause: any = {
      coachId,
      date: { gte: startDate, lt: endOfDay }
    }

    if (hasPersonalizedWorkouts) {
      whereClause.isPersonalized = true
      whereClause.targetUserId = userId
    } else {
      // Si no tiene planificaciones personalizadas, filtrar por disciplinas asignadas
      // (alineado con el comportamiento de /api/planifications/month)
      let disciplineIdsToUse: number[] = []

      if (userDisciplines.length > 0) {
        disciplineIdsToUse = userDisciplines.map(ud => ud.disciplineId)
      } else if (preference?.preferredDisciplineId) {
        disciplineIdsToUse = [preference.preferredDisciplineId]
      }

      if (disciplineIdsToUse.length > 0) {
        whereClause.disciplineId = {
          in: disciplineIdsToUse
        }
      }
    }

    const planifications = await prisma.planification.findMany({
      where: whereClause,
      select: {
        date: true,
        title: true,
        description: true,
        isCompleted: true
      },
      orderBy: { date: 'asc' }
    })

    const data = planifications.map(p => {
      const dateObj = p.date instanceof Date ? p.date : new Date(p.date)
      const year = dateObj.getUTCFullYear()
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getUTCDate()).padStart(2, '0')
      return {
        date: `${year}-${month}-${day}`,
        title: p.title,
        description: p.description,
        isCompleted: p.isCompleted
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching range planifications:', error)
    return NextResponse.json(
      { error: 'Error al cargar planificaciones' },
      { status: 500 }
    )
  }
}
