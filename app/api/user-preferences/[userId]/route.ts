import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/user-preferences/[userId]
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      WHERE up.user_id = ${params.userId}
    `

    const preference = preferences.length > 0 ? preferences[0] : null

    return NextResponse.json(preference)
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/user-preferences/[userId]
export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preferred_discipline_id, preferred_level_id } = body

    // Verificar si ya existen preferencias
    const existing = await sql`
      SELECT id FROM user_preferences WHERE user_id = ${params.userId}
    `

    let result
    if (existing.length > 0) {
      // Actualizar
      const updated = await sql`
        UPDATE user_preferences 
        SET preferred_discipline_id = ${preferred_discipline_id}, 
            preferred_level_id = ${preferred_level_id}, 
            updated_at = NOW()
        WHERE user_id = ${params.userId}
        RETURNING *
      `
      result = updated[0]
    } else {
      // Crear
      const inserted = await sql`
        INSERT INTO user_preferences (user_id, preferred_discipline_id, preferred_level_id)
        VALUES (${params.userId}, ${preferred_discipline_id}, ${preferred_level_id})
        RETURNING *
      `
      result = inserted[0]
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/user-preferences/[userId]
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await sql`
      DELETE FROM user_preferences WHERE user_id = ${params.userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}