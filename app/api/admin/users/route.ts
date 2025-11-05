import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/admin/users?adminId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 400 })
    }

    // MVP - Modelo B2C: Mostrar TODOS los usuarios (sin filtro por asignación)
    // TODO: Cuando migren a modelo con coaches/gimnasios, descomentar el filtro abajo
    // y usar la lógica de admin_user_assignments
    
    // Obtener datos de TODOS los usuarios (MVP)
    // Nota: Usamos la tabla 'users' directamente ya que 'profiles' puede no existir
    // Cuando se implemente la tabla profiles, cambiar a: SELECT * FROM profiles
    try {
      // Intentar obtener usuarios con created_at si existe, sino usar valores por defecto
      let users
      try {
        users = await sql`
          SELECT 
            id,
            email,
            COALESCE(name, email) as full_name,
            NULL::text as avatar_url,
            created_at,
            updated_at
          FROM users 
          ORDER BY created_at DESC NULLS LAST
        `
      } catch (err: any) {
        // Si created_at no existe, hacer query sin ese campo
        if (err?.code === '42703' || err?.message?.includes('does not exist')) {
          users = await sql`
            SELECT 
              id,
              email,
              COALESCE(name, email) as full_name,
              NULL::text as avatar_url,
              NOW() as created_at,
              NOW() as updated_at
            FROM users 
            ORDER BY id DESC
          `
        } else {
          throw err
        }
      }

      // Si no hay usuarios, retornar array vacío
      if (users.length === 0) {
        return NextResponse.json([])
      }

      // Obtener IDs de usuarios
      const userIds = users.map((u: any) => u.id)

    // CÓDIGO PARA FUTURA MIGRACIÓN (comentado):
    // Obtener IDs de usuarios asignados al admin
    // const assignments = await sql`
    //   SELECT user_id FROM admin_user_assignments 
    //   WHERE admin_id = ${adminId} AND is_active = true
    // `
    // if (assignments.length === 0) {
    //   return NextResponse.json([])
    // }
    // const userIds: string[] = (assignments as any[]).map((a: any) => a.user_id)
    // const users = await sql`
    //   SELECT * FROM profiles 
    //   WHERE id = ANY(${userIds}::uuid[]) 
    //   ORDER BY created_at DESC
    // `

      // Obtener suscripciones de usuarios
    const subscriptions = await sql`
      SELECT 
        s.*,
        sp.id as plan_id,
        sp.name as plan_name,
        sp.description as plan_description,
        sp.price as plan_price,
        sp.currency as plan_currency,
        sp.interval as plan_interval,
        sp.features as plan_features,
        sp.is_active as plan_is_active
      FROM subscriptions s
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = ANY(${userIds}::uuid[]) AND s.status = 'active'
    `

      // Obtener preferencias de usuarios
      const preferences = await sql`
        SELECT 
          up.*,
          d.id as discipline_id,
          d.name as discipline_name,
          d.color as discipline_color,
          dl.id as level_id,
          dl.name as level_name,
          dl.description as level_description
        FROM user_preferences up
        LEFT JOIN disciplines d ON up.preferred_discipline_id = d.id
        LEFT JOIN discipline_levels dl ON up.preferred_level_id = dl.id
        WHERE up.user_id = ANY(${userIds}::uuid[])
      `

      // Asegurar que subscriptions y preferences sean arrays
      const subscriptionsArray = Array.isArray(subscriptions) ? subscriptions : []
      const preferencesArray = Array.isArray(preferences) ? preferences : []

      // Combinar usuarios con sus preferencias y suscripciones
      const usersWithPreferences = users.map((user: any) => {
      const userPreference = preferencesArray.find((p: any) => p.user_id === user.id)
      const userSubscription = subscriptionsArray.find((s: any) => s.user_id === user.id)
      
      return {
        ...user,
        has_subscription: !!userSubscription,
        subscription_status: userSubscription?.status || null,
        subscription: userSubscription ? {
          id: userSubscription.id,
          user_id: userSubscription.user_id,
          plan_id: userSubscription.plan_id,
          status: userSubscription.status,
          current_period_start: userSubscription.current_period_start,
          current_period_end: userSubscription.current_period_end,
          cancel_at_period_end: userSubscription.cancel_at_period_end,
          plan: {
            id: userSubscription.plan_id,
            name: userSubscription.plan_name,
            description: userSubscription.plan_description,
            price: userSubscription.plan_price,
            currency: userSubscription.plan_currency,
            interval: userSubscription.plan_interval,
            features: userSubscription.plan_features,
            is_active: userSubscription.plan_is_active
          }
        } : null,
        preferences: userPreference ? {
          id: userPreference.id,
          user_id: userPreference.user_id,
          preferred_discipline_id: userPreference.preferred_discipline_id,
          preferred_level_id: userPreference.preferred_level_id,
          created_at: userPreference.created_at,
          updated_at: userPreference.updated_at,
          discipline: userPreference.discipline_name ? {
            id: userPreference.discipline_id,
            name: userPreference.discipline_name,
            color: userPreference.discipline_color
          } : undefined,
          level: userPreference.level_name ? {
            id: userPreference.level_id,
            name: userPreference.level_name,
            description: userPreference.level_description
          } : undefined
        } : undefined
      }
    })

      return NextResponse.json(usersWithPreferences)
    } catch (dbError: any) {
      // Si la tabla users no existe o hay error, devolver array vacío
      if (dbError?.code === '42P01' || dbError?.message?.includes('does not exist')) {
        console.error('Database table does not exist:', dbError?.message)
        return NextResponse.json([])
      }
      throw dbError
    }
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}