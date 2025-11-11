import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workouts?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!session?.user?.id && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUserId = userId ? parseInt(userId) : session?.user?.id

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const workouts = await prisma.workout.findMany({
      where: { userId: targetUserId },
      include: {
        planification: {
          select: {
            title: true,
            description: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    })

    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workouts
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planification_id, data, completed_at, duration_seconds } = body

    const result = await prisma.workout.create({
      data: {
        userId: session.user.id,
        planificationId: planification_id || null,
        data: data || {},
        completedAt: completed_at ? new Date(completed_at) : null,
        durationSeconds: duration_seconds || null
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}