import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCachedUserPreferences } from '@/lib/cache'

// GET /api/user-preferences/[userId]
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(params.userId)
    const result = await getCachedUserPreferences(userId)

    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
    return response
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/user-preferences/[userId]
export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preferred_discipline_id, preferred_level_id } = body
    const userId = parseInt(params.userId)

    // Convertir preferred_discipline_id y preferred_level_id a números enteros
    const preferredDisciplineIdNum = preferred_discipline_id 
      ? parseInt(String(preferred_discipline_id), 10)
      : null
    
    const preferredLevelIdNum = preferred_level_id
      ? parseInt(String(preferred_level_id), 10)
      : null

    // Validar que los valores convertidos sean números válidos
    if (preferredDisciplineIdNum !== null && isNaN(preferredDisciplineIdNum)) {
      return NextResponse.json(
        { error: 'preferred_discipline_id debe ser un número válido' },
        { status: 400 }
      )
    }

    if (preferredLevelIdNum !== null && isNaN(preferredLevelIdNum)) {
      return NextResponse.json(
        { error: 'preferred_level_id debe ser un número válido' },
        { status: 400 }
      )
    }

    // Verificar si el usuario tiene una suscripción activa
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      },
      orderBy: {
        currentPeriodStart: 'desc'
      }
    })

    // Obtener preferencias actuales
    const currentPreferences = await prisma.userPreference.findUnique({
      where: { userId }
    })

    // Validar cambio de disciplina (sin restricciones de bloqueo)
    const isChangingDiscipline = preferredDisciplineIdNum !== null &&
      currentPreferences?.preferredDisciplineId !== preferredDisciplineIdNum

    const now = new Date()

    // Solo actualizar lastPreferenceChangeDate si cambia la disciplina
    const shouldUpdateChangeDate = isChangingDiscipline || !currentPreferences

    // Usar upsert para crear o actualizar
    const result = await prisma.userPreference.upsert({
      where: { userId },
      update: {
        preferredDisciplineId: preferredDisciplineIdNum,
        preferredLevelId: preferredLevelIdNum,
        lastPreferenceChangeDate: shouldUpdateChangeDate ? now : undefined
      },
      create: {
        userId,
        preferredDisciplineId: preferredDisciplineIdNum,
        preferredLevelId: preferredLevelIdNum,
        lastPreferenceChangeDate: now
      }
    })

    revalidateTag('user-preferences')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/user-preferences/[userId]
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.userPreference.delete({
      where: { userId: parseInt(params.userId) }
    }).catch(() => {
      // Si no existe, no es un error
    })

    revalidateTag('user-preferences')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
