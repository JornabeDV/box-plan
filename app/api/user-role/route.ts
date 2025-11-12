import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

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

    // Agregar caché para evitar llamadas repetidas
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30')
    
    return response
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}