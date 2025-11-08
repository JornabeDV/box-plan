import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

// PUT /api/user-progress
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, planification_id, admin_id, progress_data, notes, completed_at } = body

    // Verificar si ya existe
    const existing = await sql`
      SELECT id FROM user_progress 
      WHERE user_id = ${user_id} AND planification_id = ${planification_id}
    `

    let result
    if (existing.length > 0) {
      // Actualizar
      const updated = await sql`
        UPDATE user_progress
        SET progress_data = ${JSON.stringify(progress_data)}::jsonb,
            notes = ${notes},
            completed_at = ${completed_at},
            updated_at = NOW()
        WHERE id = ${existing[0].id}
        RETURNING *
      `
      result = updated[0]
    } else {
      // Crear
      const inserted = await sql`
        INSERT INTO user_progress (user_id, planification_id, admin_id, progress_data, notes, completed_at)
        VALUES (${user_id}, ${planification_id}, ${admin_id}, ${JSON.stringify(progress_data)}::jsonb, ${notes}, ${completed_at})
        RETURNING *
      `
      result = inserted[0]
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating user progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}