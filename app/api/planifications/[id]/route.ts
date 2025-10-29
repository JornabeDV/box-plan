import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// PATCH /api/planifications/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Verificar que la planificación existe
    const existing = await sql`
      SELECT id FROM planifications WHERE id = ${id}
    `

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: 'Planificación no encontrada' },
        { status: 404 }
      )
    }

    // Construir update dinámicamente usando template literals
    let setClause = ''
    const conditions: string[] = []

    if (body.discipline_id !== undefined) {
      conditions.push(`discipline_id = ${body.discipline_id}`)
    }
    if (body.discipline_level_id !== undefined) {
      conditions.push(`discipline_level_id = ${body.discipline_level_id}`)
    }
    if (body.date !== undefined) {
      conditions.push(`date = '${body.date}'`)
    }
    if (body.estimated_duration !== undefined) {
      conditions.push(`estimated_duration = ${body.estimated_duration}`)
    }
    if (body.blocks !== undefined) {
      conditions.push(`blocks = '${JSON.stringify(body.blocks)}'::jsonb`)
    }
    if (body.notes !== undefined) {
      conditions.push(`notes = '${body.notes.replace(/'/g, "''")}'`)
    }
    if (body.is_active !== undefined) {
      conditions.push(`is_active = ${body.is_active}`)
    }

    if (conditions.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    conditions.push('updated_at = NOW()')
    setClause = conditions.join(', ')

    await sql.unsafe(`UPDATE planifications SET ${setClause} WHERE id = '${id}'`)

    // Obtener con relaciones
    const withRelations = await sql`
      SELECT 
        p.*,
        jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'color', d.color,
          'icon', d.icon
        ) as discipline,
        jsonb_build_object(
          'id', dl.id,
          'name', dl.name,
          'description', dl.description
        ) as discipline_level
      FROM planifications p
      LEFT JOIN disciplines d ON p.discipline_id = d.id
      LEFT JOIN discipline_levels dl ON p.discipline_level_id = dl.id
      WHERE p.id = ${id}
    `

    const transformed = {
      ...withRelations[0],
      discipline: typeof withRelations[0].discipline === 'string' 
        ? JSON.parse(withRelations[0].discipline) 
        : withRelations[0].discipline,
      discipline_level: typeof withRelations[0].discipline_level === 'string' 
        ? JSON.parse(withRelations[0].discipline_level) 
        : withRelations[0].discipline_level
    }

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error updating planification:', error)
    return NextResponse.json(
      { error: 'Error al actualizar planificación' },
      { status: 500 }
    )
  }
}

// DELETE /api/planifications/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = params

    const result = await sql`
      DELETE FROM planifications WHERE id = ${id}
      RETURNING id
    `

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Planificación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting planification:', error)
    return NextResponse.json(
      { error: 'Error al eliminar planificación' },
      { status: 500 }
    )
  }
}