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

    // Obtener IDs de usuarios asignados al admin
    const assignments = await sql`
      SELECT user_id FROM admin_user_assignments 
      WHERE admin_id = ${adminId} AND is_active = true
    `

    if (assignments.length === 0) {
      return NextResponse.json([])
    }

    const userIds: string[] = (assignments as any[]).map((a: any) => a.user_id)

    // Obtener datos de usuarios
    const users = await sql`
      SELECT * FROM profiles 
      WHERE id = ANY(${userIds}::uuid[]) 
      ORDER BY created_at DESC
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

    // Combinar usuarios con sus preferencias
    const usersWithPreferences = users.map((user: any) => {
      const userPreference = preferences.find((p: any) => p.user_id === user.id)
      
      return {
        ...user,
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
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}