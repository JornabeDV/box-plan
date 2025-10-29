import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const profiles = await sql`
        SELECT * FROM profiles WHERE id = ${session.user.id}
      `

      const profile = profiles.length > 0 ? profiles[0] : null

      // Si no hay perfil, devolver null (no es un error)
      return NextResponse.json(profile)
    } catch (dbError: any) {
      // Si la tabla no existe o hay error de DB, loguear y devolver null
      console.error('Database error fetching profile:', dbError?.message || dbError)
      
      // Si es error de tabla no existe, devolver null en lugar de error
      if (dbError?.message?.includes('does not exist') || dbError?.code === '42P01') {
        return NextResponse.json(null)
      }
      
      throw dbError
    }
  } catch (error: any) {
    console.error('Error fetching profile:', error?.message || error)
    // En caso de error desconocido, devolver null en lugar de error 500
    // para permitir que la app funcione
    return NextResponse.json(null)
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