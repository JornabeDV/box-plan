import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: 'postId requerido' }, { status: 400 })
    }

    const comments = await sql`
      SELECT * FROM forum_comments
      WHERE post_id = ${postId} AND is_approved = true AND parent_id IS NULL
      ORDER BY created_at ASC
    `

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching forum comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, content, parent_id } = body

    if (!post_id || !content) {
      return NextResponse.json({ error: 'Campos requeridos: post_id, content' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO forum_comments (post_id, author_id, content, parent_id)
      VALUES (${post_id}, ${session.user.id}, ${content}, ${parent_id || null})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error creating forum comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}