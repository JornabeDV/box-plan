import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, comment_id, reason, description } = body

    if (!reason) {
      return NextResponse.json({ error: 'reason es requerido' }, { status: 400 })
    }

    await sql`
      INSERT INTO forum_reports (reporter_id, post_id, comment_id, reason, description)
      VALUES (${session.user.id}, ${post_id || null}, ${comment_id || null}, ${reason}, ${description || null})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reporting forum content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}