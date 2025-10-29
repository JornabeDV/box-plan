import { NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

// GET /api/workout-sheet-categories
export async function GET() {
  try {
    const categories = await sql`
      SELECT *
      FROM workout_sheet_categories
      WHERE is_active = true
      ORDER BY name
    `

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error al cargar categorías' },
      { status: 500 }
    )
  }
}