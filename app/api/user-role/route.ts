import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id

    const userRole = await prisma.userRole.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!userRole) {
      return NextResponse.json({ role: null })
    }

    // Si es admin, cargar perfil también
    let adminProfile = null
    if (userRole.role === 'admin') {
      adminProfile = await prisma.adminProfile.findUnique({
        where: { userId }
      })
    }

    // Si es coach, cargar perfil también
    let coachProfile = null
    if (userRole.role === 'coach') {
      coachProfile = await prisma.coachProfile.findUnique({
        where: { userId }
      })
    }

    return NextResponse.json({
      role: userRole,
      adminProfile,
      coachProfile
    })
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}