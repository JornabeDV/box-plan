import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

// PATCH /api/workouts/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, completed_at, duration_seconds } = body
    const workoutId = parseInt(params.id, 10)

    // Preparar datos de actualización
    const updateData: any = {}
    if (data !== undefined) updateData.data = data
    if (completed_at !== undefined) updateData.completedAt = new Date(completed_at)
    if (duration_seconds !== undefined) updateData.durationSeconds = duration_seconds

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const result = await prisma.workout.update({
      where: { id: workoutId },
      data: updateData
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating workout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/workouts/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.workout.deleteMany({
      where: {
        id: parseInt(params.id, 10),
        userId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}