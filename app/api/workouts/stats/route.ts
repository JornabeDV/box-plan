import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/workouts/stats?userId=xxx
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
      select: {
        completedAt: true,
        data: true
      },
      orderBy: { completedAt: 'desc' }
    })

    // Filtrar solo scores (wod_score y strength_score)
    const scores = workouts.filter((w) => {
      if (!w.completedAt || !w.data) return false
      const data = w.data as any
      return data.type === 'wod_score' || data.type === 'strength_score'
    })

    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)

    const stats = {
      totalScores: scores.length,
      thisWeek: scores.filter((w) => {
        if (!w.completedAt) return false
        const scoreDate = new Date(w.completedAt)
        return scoreDate >= weekAgo
      }).length,
      thisMonth: scores.filter((w) => {
        if (!w.completedAt) return false
        const scoreDate = new Date(w.completedAt)
        return scoreDate >= monthAgo
      }).length,
      streak: calculateStreak(scores)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching workout stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateStreak(scores: { completedAt: Date | null }[]): number {
  if (scores.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Obtener fechas únicas de scores registrados
  const scoreDates = new Set<string>()
  for (const score of scores) {
    if (!score.completedAt) continue
    const scoreDate = new Date(score.completedAt)
    scoreDate.setHours(0, 0, 0, 0)
    scoreDates.add(scoreDate.toISOString().split('T')[0])
  }

  // Calcular racha desde hoy hacia atrás
  let streak = 0
  let currentDate = new Date(today)
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0]
    if (scoreDates.has(dateStr)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}