import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/user-workout-sheets
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const userSheets = await sql`
      SELECT 
        uws.*,
        jsonb_build_object(
          'id', ws.id,
          'title', ws.title,
          'description', ws.description,
          'plan_required', ws.plan_required,
          'template_data', ws.template_data,
          'category', jsonb_build_object(
            'name', c.name,
            'icon', c.icon,
            'color', c.color
          )
        ) as workout_sheets
      FROM user_workout_sheets uws
      LEFT JOIN workout_sheets ws ON uws.sheet_id = ws.id
      LEFT JOIN workout_sheet_categories c ON ws.category_id = c.id
      WHERE uws.user_id = ${session.user.id}
      ORDER BY uws.created_at DESC
    `

    // Transformar workout_sheets de JSONB
    const transformed = userSheets.map(sheet => ({
      ...sheet,
      workout_sheets: typeof sheet.workout_sheets === 'string' 
        ? JSON.parse(sheet.workout_sheets) 
        : sheet.workout_sheets
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching user workout sheets:', error)
    return NextResponse.json(
      { error: 'Error al cargar planillas del usuario' },
      { status: 500 }
    )
  }
}

// POST /api/user-workout-sheets
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sheet_id, data = {} } = body

    if (!sheet_id) {
      return NextResponse.json(
        { error: 'sheet_id es requerido' },
        { status: 400 }
      )
    }

    const newUserSheet = await sql`
      INSERT INTO user_workout_sheets (
        user_id,
        sheet_id,
        data
      )
      VALUES (
        ${session.user.id},
        ${sheet_id},
        ${JSON.stringify(data)}::jsonb
      )
      RETURNING *
    `

    // Obtener con la relación workout_sheets
    const sheetWithDetails = await sql`
      SELECT 
        uws.*,
        jsonb_build_object(
          'id', ws.id,
          'title', ws.title,
          'description', ws.description,
          'plan_required', ws.plan_required,
          'template_data', ws.template_data,
          'category', jsonb_build_object(
            'name', c.name,
            'icon', c.icon,
            'color', c.color
          )
        ) as workout_sheets
      FROM user_workout_sheets uws
      LEFT JOIN workout_sheets ws ON uws.sheet_id = ws.id
      LEFT JOIN workout_sheet_categories c ON ws.category_id = c.id
      WHERE uws.id = ${newUserSheet[0].id}
    `

    const transformed = {
      ...sheetWithDetails[0],
      workout_sheets: typeof sheetWithDetails[0].workout_sheets === 'string' 
        ? JSON.parse(sheetWithDetails[0].workout_sheets) 
        : sheetWithDetails[0].workout_sheets
    }

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error creating user workout sheet:', error)
    return NextResponse.json(
      { error: 'Error al crear planilla del usuario' },
      { status: 500 }
    )
  }
}