import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/disciplines?adminId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 400 })
    }

    // Cargar disciplinas
    const disciplines = await sql`
      SELECT * FROM disciplines 
      WHERE admin_id = ${adminId} AND is_active = true 
      ORDER BY order_index ASC
    `

    if (disciplines.length === 0) {
      return NextResponse.json({ disciplines: [], levels: [] })
    }

    const disciplineIds: string[] = (disciplines as any[]).map((d: any) => d.id)

    // Cargar niveles
    const levels = await sql`
      SELECT * FROM discipline_levels 
      WHERE discipline_id = ANY(${disciplineIds}::uuid[]) AND is_active = true 
      ORDER BY order_index ASC
    `

    // Combinar disciplinas con sus niveles
    const disciplinesWithLevels = (disciplines as any[]).map((discipline: any) => ({
      ...discipline,
      levels: (levels as any[]).filter((level: any) => level.discipline_id === discipline.id)
    }))

    return NextResponse.json({ disciplines: disciplinesWithLevels, levels })
  } catch (error) {
    console.error('Error fetching disciplines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/disciplines
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color, admin_id, order_index, levels } = body

    // Insertar disciplina usando template literal
    const result = await sql`
      INSERT INTO disciplines (name, description, color, admin_id, order_index)
      VALUES (${name}, ${description || null}, ${color || '#3B82F6'}, ${admin_id}, ${order_index || 0})
      RETURNING *
    `

    const newDiscipline = result[0]

    // Crear niveles si existen
    if (levels && levels.length > 0) {
      for (const level of levels) {
        await sql`
          INSERT INTO discipline_levels (discipline_id, name, description, order_index)
          VALUES (${newDiscipline.id}, ${level.name}, ${level.description || null}, ${level.order_index || 0})
        `
      }
    }

    return NextResponse.json(newDiscipline)
  } catch (error) {
    console.error('Error creating discipline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}