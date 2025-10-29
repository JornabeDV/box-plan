import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// PATCH /api/user-workout-sheets/[id]/complete
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = params

    await sql`
      UPDATE user_workout_sheets
      SET 
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing user workout sheet:', error)
    return NextResponse.json(
      { error: 'Error al completar planilla' },
      { status: 500 }
    )
  }
}