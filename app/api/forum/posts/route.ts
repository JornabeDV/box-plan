import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = sql`
      SELECT 
        p.*,
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'color', c.color,
          'icon', c.icon
        ) as category
      FROM forum_posts p
      LEFT JOIN forum_categories c ON p.category_id = c.id
      WHERE p.is_approved = true
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    if (categoryId) {
      query = sql`
        SELECT 
          p.*,
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'description', c.description,
            'color', c.color,
            'icon', c.icon
          ) as category
        FROM forum_posts p
        LEFT JOIN forum_categories c ON p.category_id = c.id
        WHERE p.is_approved = true AND p.category_id = ${categoryId}
        ORDER BY p.is_pinned DESC, p.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    }

    const posts = await query
    
    const transformed = posts.map((post: any) => ({
      ...post,
      category: typeof post.category === 'string' ? JSON.parse(post.category) : post.category
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching forum posts:', error)
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
    const { title, content, category_id } = body

    if (!title || !content || !category_id) {
      return NextResponse.json({ error: 'Campos requeridos: title, content, category_id' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO forum_posts (title, content, author_id, category_id)
      VALUES (${title}, ${content}, ${session.user.id}, ${category_id})
      RETURNING *
    `

    const category = await sql`
      SELECT * FROM forum_categories WHERE id = ${category_id}
    `

    const postWithCategory = {
      ...result[0],
      category: category[0]
    }

    return NextResponse.json(postWithCategory)
  } catch (error) {
    console.error('Error creating forum post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}