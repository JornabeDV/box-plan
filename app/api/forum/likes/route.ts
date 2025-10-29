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
    const { post_id, comment_id } = body

    if (!post_id && !comment_id) {
      return NextResponse.json({ error: 'post_id o comment_id requerido' }, { status: 400 })
    }

    // Verificar si ya existe
    const existing = await sql`
      SELECT id FROM forum_likes
      WHERE user_id = ${session.user.id}
        AND ${post_id ? sql`post_id = ${post_id}` : sql`comment_id = ${comment_id}`}
    `

    if (existing.length > 0) {
      // Quitar like
      await sql`
        DELETE FROM forum_likes
        WHERE id = ${existing[0].id}
      `
      return NextResponse.json({ liked: false })
    } else {
      // Dar like
      await sql`
        INSERT INTO forum_likes (user_id, post_id, comment_id)
        VALUES (${session.user.id}, ${post_id || null}, ${comment_id || null})
      `
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Error toggling forum like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}