import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRoles = await sql`
      SELECT * FROM user_roles_simple WHERE user_id = ${session.user.id}
    `

    const userRole = userRoles && userRoles.length > 0 ? userRoles[0] : null

    if (!userRole) {
      return NextResponse.json({ role: null })
    }

    // Si es admin, cargar perfil también
    let adminProfile = null
    if (userRole.role === 'admin') {
      const adminProfiles = await sql`
        SELECT * FROM admin_profiles WHERE user_id = ${session.user.id}
      `
      adminProfile = adminProfiles && adminProfiles.length > 0 ? adminProfiles[0] : null
    }

    return NextResponse.json({
      role: userRole,
      adminProfile
    })
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}