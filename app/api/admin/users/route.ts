import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get('coachId')

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID required' }, { status: 400 })
    }

    // Convertir coachId a número
    const coachIdNum = parseInt(coachId, 10)
    if (isNaN(coachIdNum)) {
      return NextResponse.json({ error: 'Invalid coach ID' }, { status: 400 })
    }

    try {
      // Primero obtener las relaciones activas del coach con estudiantes
      const relationships = await prisma.coachStudentRelationship.findMany({
        where: {
          coachId: coachIdNum,
          status: 'active'
        },
        select: {
          studentId: true
        }
      })

      // Si no hay estudiantes asociados, retornar array vacío
      if (relationships.length === 0) {
        return NextResponse.json([])
      }

      // Obtener IDs de estudiantes
      const studentIds = relationships.map(r => r.studentId)

      // Obtener datos de los estudiantes asociados al coach
      const users = await prisma.user.findMany({
        where: {
          id: { in: studentIds }
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      // Si no hay usuarios, retornar array vacío
      if (users.length === 0) {
        return NextResponse.json([])
      }

      // Obtener IDs de usuarios
      const userIds = users.map(u => u.id)

      // Obtener la suscripción más reciente de cada usuario (no solo activas)
      // Esto permite mostrar el estado correcto incluso si está cancelada o vencida
      const allSubscriptions = await prisma.subscription.findMany({
        where: {
          userId: { in: userIds }
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              currency: true,
              interval: true,
              features: true,
              isActive: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Obtener la suscripción más reciente de cada usuario
      const subscriptionsMap = new Map<number, typeof allSubscriptions[0]>()
      for (const sub of allSubscriptions) {
        if (!subscriptionsMap.has(sub.userId)) {
          subscriptionsMap.set(sub.userId, sub)
        }
      }
      const subscriptions = Array.from(subscriptionsMap.values())

      // Obtener preferencias de usuarios
      const preferences = await prisma.userPreference.findMany({
        where: { userId: { in: userIds } },
        include: {
          // Nota: Como no hay foreign keys, cargamos manualmente
        }
      })

      // Cargar disciplinas y niveles para las preferencias
      const disciplineIds = preferences
        .map(p => p.preferredDisciplineId)
        .filter((id): id is number => id !== null)
      const levelIds = preferences
        .map(p => p.preferredLevelId)
        .filter((id): id is number => id !== null)

      const disciplines = disciplineIds.length > 0
        ? await prisma.discipline.findMany({
            where: { id: { in: disciplineIds } },
            select: { id: true, name: true, color: true }
          })
        : []

      const levels = levelIds.length > 0
        ? await prisma.disciplineLevel.findMany({
            where: { id: { in: levelIds } },
            select: { id: true, name: true, description: true }
          })
        : []

      // Crear mapas para acceso rápido
      const disciplineMap = new Map(disciplines.map(d => [d.id, d]))
      const levelMap = new Map(levels.map(l => [l.id, l]))

      // Combinar usuarios con sus preferencias y suscripciones
      const usersWithPreferences = users.map(user => {
        const userPreference = preferences.find(p => p.userId === user.id)
        const userSubscription = subscriptions.find(s => s.userId === user.id)

        const discipline = userPreference?.preferredDisciplineId
          ? disciplineMap.get(userPreference.preferredDisciplineId)
          : null
        const level = userPreference?.preferredLevelId
          ? levelMap.get(userPreference.preferredLevelId)
          : null

        return {
          id: user.id,
          email: user.email,
          full_name: user.name || user.email,
          avatar_url: user.image,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          // has_subscription debe ser true solo si la suscripción está activa
          has_subscription: userSubscription?.status === 'active',
          subscription_status: userSubscription?.status || null,
          subscription: userSubscription && userSubscription.plan ? {
            id: userSubscription.id,
            user_id: userSubscription.userId,
            plan_id: userSubscription.planId,
            status: userSubscription.status,
            current_period_start: userSubscription.currentPeriodStart,
            current_period_end: userSubscription.currentPeriodEnd,
            cancel_at_period_end: userSubscription.cancelAtPeriodEnd,
            payment_method: (userSubscription as any).paymentMethod || null,
            plan: {
              id: userSubscription.plan.id,
              name: userSubscription.plan.name,
              description: userSubscription.plan.description,
              price: Number(userSubscription.plan.price),
              currency: userSubscription.plan.currency,
              interval: userSubscription.plan.interval,
              features: userSubscription.plan.features,
              is_active: userSubscription.plan.isActive
            }
          } : null,
          preferences: userPreference ? {
            id: userPreference.id,
            user_id: userPreference.userId,
            preferred_discipline_id: userPreference.preferredDisciplineId,
            preferred_level_id: userPreference.preferredLevelId,
            created_at: userPreference.createdAt,
            updated_at: userPreference.updatedAt,
            discipline: discipline ? {
              id: discipline.id,
              name: discipline.name,
              color: discipline.color
            } : undefined,
            level: level ? {
              id: level.id,
              name: level.name,
              description: level.description
            } : undefined
          } : undefined
        }
      })

      return NextResponse.json(usersWithPreferences)
    } catch (dbError: any) {
      console.error('Database error:', dbError?.message)
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}