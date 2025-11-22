import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener el rol del usuario
    const userRole = await prisma.userRole.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!userRole) {
      return NextResponse.json({ role: null })
    }

    // Cargar perfiles en paralelo solo si es necesario
    const [adminProfile, coachProfile] = await Promise.all([
      userRole.role === 'admin' 
        ? prisma.adminProfile.findUnique({ where: { userId } })
        : Promise.resolve(null),
      userRole.role === 'coach'
        ? prisma.coachProfile.findUnique({ where: { userId } })
        : Promise.resolve(null)
    ])

    const response = NextResponse.json({
      role: userRole,
      adminProfile,
      coachProfile
    })

    // Deshabilitar cache para evitar problemas al cambiar de usuario
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}