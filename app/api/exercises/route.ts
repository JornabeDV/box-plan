import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/exercises?search=back+squat&category=Fuerza
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const where: any = {
      coachId,
      isActive: true,
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    if (category) {
      where.category = category
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        videoUrl: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const transformed = exercises.map((e) => ({
      id: String(e.id),
      name: e.name,
      category: e.category,
      description: e.description,
      video_url: e.videoUrl,
      image_url: e.imageUrl,
      is_active: e.isActive,
      created_at: e.createdAt.toISOString(),
      updated_at: e.updatedAt.toISOString(),
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Error al cargar ejercicios' },
      { status: 500 }
    )
  }
}

// POST /api/exercises
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json(
        { error: 'No autorizado. Solo coaches pueden crear ejercicios.' },
        { status: 403 }
      )
    }

    const coachId = authCheck.profile.id
    const body = await request.json()

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'El nombre del ejercicio es requerido' },
        { status: 400 }
      )
    }

    const created = await prisma.exercise.create({
      data: {
        coachId,
        name: body.name.trim(),
        category: body.category?.trim() || null,
        description: body.description?.trim() || null,
        videoUrl: body.video_url?.trim() || null,
        imageUrl: body.image_url?.trim() || null,
      },
    })

    return NextResponse.json(
      {
        id: String(created.id),
        name: created.name,
        category: created.category,
        description: created.description,
        video_url: created.videoUrl,
        image_url: created.imageUrl,
        is_active: created.isActive,
        created_at: created.createdAt.toISOString(),
        updated_at: created.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: 'Error al crear ejercicio' },
      { status: 500 }
    )
  }
}
