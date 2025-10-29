import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const categories = await sql`
      SELECT * FROM forum_categories
      WHERE is_active = true
      ORDER BY order_index ASC
    `

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching forum categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}