import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/planifications?adminId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return NextResponse.json({ error: 'adminId requerido' }, { status: 400 })
    }

    const planifications = await sql`
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
      WHERE p.admin_id = ${adminId}
      ORDER BY p.date ASC
    `

    // Transformar los campos JSONB
    const transformed = planifications.map((p: any) => ({
      ...p,
      discipline: typeof p.discipline === 'string' ? JSON.parse(p.discipline) : p.discipline,
      discipline_level: typeof p.discipline_level === 'string' ? JSON.parse(p.discipline_level) : p.discipline_level
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching planifications:', error)
    return NextResponse.json(
      { error: 'Error al cargar planificaciones' },
      { status: 500 }
    )
  }
}

// POST /api/planifications
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { admin_id, discipline_id, discipline_level_id, date, estimated_duration, blocks, notes, is_active } = body

    if (!admin_id || !discipline_id || !discipline_level_id || !date) {
      return NextResponse.json(
        { error: 'Campos requeridos: admin_id, discipline_id, discipline_level_id, date' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO planifications (
        admin_id,
        discipline_id,
        discipline_level_id,
        date,
        estimated_duration,
        blocks,
        notes,
        is_active
      )
      VALUES (
        ${admin_id},
        ${discipline_id},
        ${discipline_level_id},
        ${date},
        ${estimated_duration || null},
        ${JSON.stringify(blocks || [])}::jsonb,
        ${notes || null},
        ${is_active !== undefined ? is_active : true}
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error creating planification:', error)
    return NextResponse.json(
      { error: 'Error al crear planificación' },
      { status: 500 }
    )
  }
}