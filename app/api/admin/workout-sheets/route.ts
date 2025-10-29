import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/admin/workout-sheets
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId') || session.user.id
    const query = searchParams.get('q')

    let sheets
    if (query) {
      // Búsqueda con filtro de texto
      sheets = await sql`
        SELECT 
          ws.*,
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'description', c.description,
            'icon', c.icon
          ) as category
        FROM workout_sheets ws
        LEFT JOIN workout_sheet_categories c ON ws.category_id = c.id
        WHERE ws.admin_id = ${adminId}
          AND ws.is_active = true
          AND (ws.title ILIKE ${`%${query}%`} OR ws.description ILIKE ${`%${query}%`})
        ORDER BY ws.created_at DESC
      `
    } else {
      // Lista normal
      sheets = await sql`
        SELECT 
          ws.*,
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'description', c.description,
            'icon', c.icon
          ) as category
        FROM workout_sheets ws
        LEFT JOIN workout_sheet_categories c ON ws.category_id = c.id
        WHERE ws.admin_id = ${adminId}
          AND ws.is_active = true
        ORDER BY ws.created_at DESC
      `
    }

    // Transformar category de JSONB
    const transformed = (sheets as any[]).map((sheet: any) => ({
      ...sheet,
      category: typeof sheet.category === 'string' 
        ? JSON.parse(sheet.category) 
        : sheet.category
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching workout sheets:', error)
    return NextResponse.json(
      { error: 'Error al cargar planillas' },
      { status: 500 }
    )
  }
}

// POST /api/admin/workout-sheets
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      category_id,
      title,
      description,
      content,
      difficulty,
      estimated_duration,
      equipment_needed = [],
      tags = [],
      is_template = false,
      is_public = false
    } = body

    const newSheet = await sql`
      INSERT INTO workout_sheets (
        admin_id,
        category_id,
        title,
        description,
        content,
        difficulty,
        estimated_duration,
        equipment_needed,
        tags,
        is_template,
        is_public,
        is_active
      )
      VALUES (
        ${session.user.id},
        ${category_id},
        ${title},
        ${description},
        ${content},
        ${difficulty},
        ${estimated_duration},
        ${JSON.stringify(equipment_needed)}::jsonb,
        ${JSON.stringify(tags)}::jsonb,
        ${is_template},
        ${is_public},
        true
      )
      RETURNING *
    `

    // Obtener con categoría
    const sheetWithCategory = await sql`
      SELECT 
        ws.*,
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'icon', c.icon
        ) as category
      FROM workout_sheets ws
      LEFT JOIN workout_sheet_categories c ON ws.category_id = c.id
      WHERE ws.id = ${newSheet[0].id}
    `

    const transformed = {
      ...sheetWithCategory[0],
      category: typeof sheetWithCategory[0].category === 'string' 
        ? JSON.parse(sheetWithCategory[0].category) 
        : sheetWithCategory[0].category
    }

    return NextResponse.json({ data: transformed, error: null })
  } catch (error) {
    console.error('Error creating workout sheet:', error)
    return NextResponse.json(
      { error: 'Error al crear planilla' },
      { status: 500 }
    )
  }
}