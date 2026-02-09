import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { requireProgressTracking } from '@/lib/api-feature-guards'

// PUT /api/user-progress
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar si el usuario tiene acceso a la funcionalidad de seguimiento de progreso
    const guard = await requireProgressTracking(userId)
    if (!guard.allowed && guard.response) {
      return guard.response
    }

    const body = await request.json()
    const { user_id, planification_id, coach_id, progress_data, notes, completed_at } = body
    
    // Verificar que el usuario solo pueda modificar su propio progreso
    if (user_id !== userId) {
      return NextResponse.json({ error: 'No puedes modificar el progreso de otro usuario' }, { status: 403 })
    }

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