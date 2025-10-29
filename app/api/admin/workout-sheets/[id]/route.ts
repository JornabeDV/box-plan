import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// PATCH /api/admin/workout-sheets/[id]
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

    // Verificar que es admin
    const userRole = await sql`
      SELECT role FROM user_roles_simple WHERE user_id = ${session.user.id}
    `

    if (!userRole[0] || userRole[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Construir query dinámico para UPDATE
    const fields = Object.keys(body)
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    
    const updated = await sql`
      UPDATE workout_sheets
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ data: updated[0], error: null })
  } catch (error) {
    console.error('Error updating workout sheet:', error)
    return NextResponse.json(
      { error: 'Error al actualizar planilla' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/workout-sheets/[id]
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

    // Verificar que es admin
    const userRole = await sql`
      SELECT role FROM user_roles_simple WHERE user_id = ${session.user.id}
    `

    if (!userRole[0] || userRole[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = params

    await sql`
      UPDATE workout_sheets
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ error: null })
  } catch (error) {
    console.error('Error deleting workout sheet:', error)
    return NextResponse.json(
      { error: 'Error al eliminar planilla' },
      { status: 500 }
    )
  }
}