import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/user-progress
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, planification_id, coach_id, progress_data, notes, completed_at } = body

    // Buscar si ya existe un registro para este usuario y planificación
    const existing = await prisma.userProgress.findFirst({
      where: {
        userId: user_id,
        planificationId: planification_id
      }
    })

    let result
    if (existing) {
      // Actualizar registro existente
      result = await prisma.userProgress.update({
        where: { id: existing.id },
        data: {
          progressData: progress_data || {},
          notes: notes || null,
          completedAt: completed_at ? new Date(completed_at) : null,
          coachId: coach_id || existing.coachId // Mantener coachId existente si no se proporciona
        }
      })
    } else {
      // Crear nuevo registro
      result = await prisma.userProgress.create({
        data: {
          userId: user_id,
          planificationId: planification_id,
          coachId: coach_id || null,
          progressData: progress_data || {},
          notes: notes || null,
          completedAt: completed_at ? new Date(completed_at) : null
        }
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating user progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}