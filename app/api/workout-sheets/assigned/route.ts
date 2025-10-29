import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

// GET /api/workout-sheets/assigned?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const assignments = await sql`
      SELECT 
        a.*,
        ws.id as ws_id,
        ws.title as ws_title,
        ws.description as ws_description,
        ws.category_id as ws_category_id,
        ws.plan_required as ws_plan_required,
        ws.template_data as ws_template_data,
        ws.is_active as ws_is_active,
        ws.is_public as ws_is_public,
        ws.created_by as ws_created_by,
        ws.created_at as ws_created_at,
        ws.updated_at as ws_updated_at,
        c.id as cat_id,
        c.name as cat_name,
        c.description as cat_description,
        c.icon as cat_icon,
        c.color as cat_color,
        ap.id as admin_id,
        ap.name as admin_name,
        ap.organization_name as admin_org_name,
        ap.organization_type as admin_org_type
      FROM workout_sheet_assignments a
      LEFT JOIN workout_sheets ws ON a.sheet_id = ws.id
      LEFT JOIN workout_sheet_categories c ON ws.category_id = c.id
      LEFT JOIN admin_profiles ap ON a.admin_id = ap.id
      WHERE a.user_id = ${userId}
      ORDER BY a.assigned_at DESC
    `

    // Transformar resultados a formato esperado
    const transformed = assignments.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      sheet_id: row.sheet_id,
      admin_id: row.admin_id,
      assigned_at: row.assigned_at,
      completed_at: row.completed_at,
      is_completed: row.is_completed,
      user_notes: row.user_notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      workout_sheet: {
        id: row.ws_id,
        title: row.ws_title,
        description: row.ws_description,
        category_id: row.ws_category_id,
        plan_required: row.ws_plan_required,
        template_data: row.ws_template_data,
        is_active: row.ws_is_active,
        is_public: row.ws_is_public,
        created_by: row.ws_created_by,
        created_at: row.ws_created_at,
        updated_at: row.ws_updated_at,
        category: row.cat_id ? {
          id: row.cat_id,
          name: row.cat_name,
          description: row.cat_description,
          icon: row.cat_icon,
          color: row.cat_color
        } : null
      },
      admin: {
        id: row.admin_id,
        name: row.admin_name,
        organization_name: row.admin_org_name,
        organization_type: row.admin_org_type
      }
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching assigned workout sheets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}