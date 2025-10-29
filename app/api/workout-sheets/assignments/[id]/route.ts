import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

// PATCH /api/workout-sheets/assignments/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { is_completed, completed_at, user_notes } = body

    const result = await sql`
      UPDATE workout_sheet_assignments
      SET is_completed = ${is_completed}, 
          completed_at = ${completed_at},
          user_notes = ${user_notes},
          updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}