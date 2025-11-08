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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Obtener fechas únicas de entrenamientos
  const workoutDates = new Set<string>()
  for (const workout of workouts) {
    if (!workout.completed_at) continue
    const workoutDate = new Date(workout.completed_at)
    workoutDate.setHours(0, 0, 0, 0)
    workoutDates.add(workoutDate.toISOString().split('T')[0])
  }

  // Calcular racha desde hoy hacia atrás
  let streak = 0
  let currentDate = new Date(today)
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0]
    if (workoutDates.has(dateStr)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}