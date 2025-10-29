import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// PATCH /api/user-workout-sheets/[id]
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
    const body = await request.json()
    const { data } = body

    if (data === undefined) {
      return NextResponse.json(
        { error: 'data es requerido' },
        { status: 400 }
      )
    }

    await sql`
      UPDATE user_workout_sheets
      SET 
        data = ${JSON.stringify(data)}::jsonb,
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user workout sheet:', error)
    return NextResponse.json(
      { error: 'Error al actualizar planilla' },
      { status: 500 }
    )
  }
}

// DELETE /api/user-workout-sheets/[id]
export async function DELETE(
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
      DELETE FROM user_workout_sheets
      WHERE id = ${id} AND user_id = ${session.user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user workout sheet:', error)
    return NextResponse.json(
      { error: 'Error al eliminar planilla' },
      { status: 500 }
    )
  }
}