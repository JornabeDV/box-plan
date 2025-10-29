import { NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

// GET /api/workout-sheets/public
export async function GET() {
  try {
    const sheets = await sql`
      SELECT 
        ws.*,
        c.id as cat_id,
        c.name as cat_name,
        c.description as cat_description,
        c.icon as cat_icon,
        c.color as cat_color
      FROM workout_sheets ws
      LEFT JOIN workout_sheet_categories c ON ws.category_id = c.id
      WHERE ws.is_public = true AND ws.is_active = true
      ORDER BY ws.created_at DESC
    `

    // Transformar resultados
    const transformed = sheets.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category_id: row.category_id,
      plan_required: row.plan_required,
      template_data: row.template_data,
      is_active: row.is_active,
      is_public: row.is_public,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      category: row.cat_id ? {
        id: row.cat_id,
        name: row.cat_name,
        description: row.cat_description,
        icon: row.cat_icon,
        color: row.cat_color
      } : null
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching public workout sheets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}