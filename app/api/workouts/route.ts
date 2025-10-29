import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/workouts?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!session?.user?.id && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUserId = userId || session?.user?.id

    const workouts = await sql`
      SELECT 
        w.*,
        ws.id as sheet_id,
        ws.title,
        ws.difficulty
      FROM workouts w
      LEFT JOIN workout_sheets ws ON w.sheet_id = ws.id
      WHERE w.user_id = ${targetUserId}
      ORDER BY w.completed_at DESC
    `

    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workouts
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sheet_id, data, completed_at, duration_seconds } = body

    const result = await sql`
      INSERT INTO workouts (user_id, sheet_id, data, completed_at, duration_seconds)
      VALUES (${session.user.id}, ${sheet_id}, ${JSON.stringify(data)}::jsonb, ${completed_at}, ${duration_seconds})
      RETURNING *
    `

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}