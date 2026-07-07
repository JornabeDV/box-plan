import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-server-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Helper para verificar acceso a la planificación
async function checkPlanificationAccess(planificationId: number, userId: number) {
  const planification = await prisma.planification.findUnique({
    where: { id: planificationId },
    select: { coachId: true },
  })

  if (!planification) {
    return { allowed: false, reason: 'Planificación no encontrada' }
  }

  // Verificar si es el coach
  const coachProfile = await prisma.coachProfile.findFirst({
    where: { userId },
    select: { id: true },
  })

  if (coachProfile && coachProfile.id === planification.coachId) {
    return { allowed: true, isCoach: true, coachId: planification.coachId }
  }

  // Verificar si es un estudiante del coach
  const relationship = await prisma.coachStudentRelationship.findFirst({
    where: {
      studentId: userId,
      coachId: planification.coachId,
      status: 'active',
    },
  })

  if (relationship) {
    return { allowed: true, isCoach: false, coachId: planification.coachId }
  }

  return { allowed: false, reason: 'No tienes acceso a esta planificación' }
}

// GET /api/planifications/[id]/notes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const planificationId = parseInt(id, 10)
    if (isNaN(planificationId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const access = await checkPlanificationAccess(planificationId, userId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 })
    }

    const notes = await prisma.planificationAthleteNote.findMany({
      where: { planificationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const transformed = notes.map((note) => ({
      id: String(note.id),
      note: note.note,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      user: {
        id: String(note.user.id),
        name: note.user.name,
        email: note.user.email,
        image: note.user.image,
      },
      isOwn: note.userId === userId,
    }))

    return NextResponse.json({ data: transformed })
  } catch (error) {
    console.error('Error fetching planification notes:', error)
    return NextResponse.json(
      { error: 'Error al cargar las notas' },
      { status: 500 }
    )
  }
}

// POST /api/planifications/[id]/notes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const planificationId = parseInt(id, 10)
    if (isNaN(planificationId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const access = await checkPlanificationAccess(planificationId, userId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 })
    }

    const body = await request.json()
    const noteText = body.note?.trim()

    if (!noteText || noteText.length === 0) {
      return NextResponse.json(
        { error: 'La nota no puede estar vacía' },
        { status: 400 }
      )
    }

    if (noteText.length > 100) {
      return NextResponse.json(
        { error: 'La nota no puede superar los 100 caracteres' },
        { status: 400 }
      )
    }

    // Verificar que el usuario no tenga ya una nota en esta planificación
    const existingNote = await prisma.planificationAthleteNote.findFirst({
      where: { planificationId, userId },
    })

    if (existingNote) {
      return NextResponse.json(
        { error: 'Ya publicaste una nota para esta planificación' },
        { status: 409 }
      )
    }

    const note = await prisma.planificationAthleteNote.create({
      data: {
        planificationId,
        userId,
        note: noteText,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: {
        id: String(note.id),
        note: note.note,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        user: {
          id: String(note.user.id),
          name: note.user.name,
          email: note.user.email,
          image: note.user.image,
        },
        isOwn: true,
      },
    })
  } catch (error) {
    console.error('Error creating planification note:', error)
    return NextResponse.json(
      { error: 'Error al crear la nota' },
      { status: 500 }
    )
  }
}
