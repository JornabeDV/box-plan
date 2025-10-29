import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// PATCH /api/workouts/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, completed_at, duration_seconds } = body

    const conditions: string[] = []

    if (data !== undefined) {
      conditions.push(`data = '${JSON.stringify(data)}'::jsonb`)
    }
    if (completed_at !== undefined) {
      conditions.push(`completed_at = '${completed_at}'`)
    }
    if (duration_seconds !== undefined) {
      conditions.push(`duration_seconds = ${duration_seconds}`)
    }

    if (conditions.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    conditions.push('updated_at = NOW()')
    const setClause = conditions.join(', ')

    const result = await sql.unsafe(`UPDATE workouts SET ${setClause} WHERE id = '${params.id}' RETURNING *`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating workout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/workouts/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await sql`
      DELETE FROM workouts WHERE id = ${params.id} AND user_id = ${session.user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}