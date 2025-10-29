import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profiles = await sql`
      SELECT * FROM profiles WHERE id = ${session.user.id}
    `

    const profile = profiles.length > 0 ? profiles[0] : null

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, avatar_url } = body

    // Construir update
    const fields: string[] = []
    if (full_name !== undefined) fields.push(`full_name = '${full_name}'`)
    if (avatar_url !== undefined) fields.push(`avatar_url = '${avatar_url}'`)
    
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    fields.push('updated_at = NOW()')

    await sql.unsafe(`
      UPDATE profiles 
      SET ${fields.join(', ')}
      WHERE id = '${session.user.id}'
      RETURNING *
    `)

    const profiles = await sql`
      SELECT * FROM profiles WHERE id = ${session.user.id}
    `

    return NextResponse.json(profiles[0])
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}