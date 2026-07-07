import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-server-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH /api/planifications/[id]/notes/[noteId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id, noteId } = await params
    const planificationId = parseInt(id, 10)
    const noteIdNum = parseInt(noteId, 10)

    if (isNaN(planificationId) || isNaN(noteIdNum)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
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

    // Buscar la nota
    const note = await prisma.planificationAthleteNote.findFirst({
      where: { id: noteIdNum, planificationId },
    })

    if (!note) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    // Solo el dueño puede editar
    if (note.userId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta nota' },
        { status: 403 }
      )
    }

    const updatedNote = await prisma.planificationAthleteNote.update({
      where: { id: noteIdNum },
      data: { note: noteText },
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
        id: String(updatedNote.id),
        note: updatedNote.note,
        createdAt: updatedNote.createdAt,
        updatedAt: updatedNote.updatedAt,
        user: {
          id: String(updatedNote.user.id),
          name: updatedNote.user.name,
          email: updatedNote.user.email,
          image: updatedNote.user.image,
        },
        isOwn: true,
      },
    })
  } catch (error) {
    console.error('Error updating planification note:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la nota' },
      { status: 500 }
    )
  }
}

// DELETE /api/planifications/[id]/notes/[noteId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id, noteId } = await params
    const planificationId = parseInt(id, 10)
    const noteIdNum = parseInt(noteId, 10)

    if (isNaN(planificationId) || isNaN(noteIdNum)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Buscar la nota
    const note = await prisma.planificationAthleteNote.findFirst({
      where: { id: noteIdNum, planificationId },
      include: {
        planification: {
          select: { coachId: true },
        },
      },
    })

    if (!note) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    // Verificar permisos: dueño de la nota o coach de la planificación
    const isOwner = note.userId === userId

    let isCoach = false
    if (!isOwner) {
      const coachProfile = await prisma.coachProfile.findFirst({
        where: { userId },
        select: { id: true },
      })
      isCoach = coachProfile?.id === note.planification.coachId
    }

    if (!isOwner && !isCoach) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta nota' },
        { status: 403 }
      )
    }

    await prisma.planificationAthleteNote.delete({
      where: { id: noteIdNum },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting planification note:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la nota' },
      { status: 500 }
    )
  }
}
