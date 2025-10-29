import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/workouts/stats?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!session?.user?.id && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUserId = userId || session?.user?.id

    const workouts = await sql`
      SELECT completed_at, duration_seconds
      FROM workouts
      WHERE user_id = ${targetUserId}
      ORDER BY completed_at DESC
    `

    const stats = {
      totalWorkouts: workouts.length,
      thisWeek: workouts.filter((w: any) => {
        if (!w.completed_at) return false
        const workoutDate = new Date(w.completed_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return workoutDate >= weekAgo
      }).length,
      thisMonth: workouts.filter((w: any) => {
        if (!w.completed_at) return false
        const workoutDate = new Date(w.completed_at)
        const monthAgo = new Date()
        monthAgo.setDate(monthAgo.getDate() - 30)
        return workoutDate >= monthAgo
      }).length,
      averageDuration: workouts.reduce((acc: number, w: any) => acc + (w.duration_seconds || 0), 0) / (workouts.length || 1),
      streak: calculateStreak(workouts)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching workout stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateStreak(workouts: any[]): number {
  if (workouts.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const workout of workouts) {
    const workoutDate = new Date(workout.completed_at)
    workoutDate.setHours(0, 0, 0, 0)
    
    const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === streak) {
      streak++
    } else if (daysDiff === streak + 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}