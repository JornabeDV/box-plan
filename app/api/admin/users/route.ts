import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/admin/users?coachId=xxx
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

    // MVP - Modelo B2C: Mostrar TODOS los usuarios (sin filtro por asignación)
    // TODO: Cuando migren a modelo con coaches/gimnasios, descomentar el filtro abajo
    // y usar la lógica de admin_user_assignments
    
    // Obtener datos de TODOS los usuarios (MVP)
    try {
      const users = await prisma.user.findMany({
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

      // Obtener suscripciones de usuarios
      const subscriptions = await prisma.subscription.findMany({
        where: {
          userId: { in: userIds },
          status: 'active'
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
        }
      })

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
          has_subscription: !!userSubscription,
          subscription_status: userSubscription?.status || null,
          subscription: userSubscription ? {
            id: userSubscription.id,
            user_id: userSubscription.userId,
            plan_id: userSubscription.planId,
            status: userSubscription.status,
            current_period_start: userSubscription.currentPeriodStart,
            current_period_end: userSubscription.currentPeriodEnd,
            cancel_at_period_end: userSubscription.cancelAtPeriodEnd,
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