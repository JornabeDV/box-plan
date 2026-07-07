import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/auth/forgot-password-whatsapp
// Busca el coach asignado a un estudiante por email y devuelve datos para contactar por WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'No se encontró información' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'No se encontró información' },
        { status: 400 }
      )
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true }
    })

    // Error genérico para evitar enumeración de usuarios
    if (!user) {
      return NextResponse.json(
        { error: 'No se encontró información' },
        { status: 404 }
      )
    }

    // Buscar relación activa con coach
    const relationship = await prisma.coachStudentRelationship.findFirst({
      where: {
        studentId: user.id,
        status: 'active'
      },
      include: {
        coach: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!relationship) {
      return NextResponse.json(
        { error: 'No se encontró información' },
        { status: 404 }
      )
    }

    const coachPhone = relationship.coach.phone
    if (!coachPhone) {
      return NextResponse.json(
        { error: 'No se encontró información' },
        { status: 404 }
      )
    }

    const studentName = user.name || user.email
    const coachName = relationship.coach.businessName || relationship.coach.user.name || 'Coach'

    const cleanedPhone = coachPhone.replace(/[^\d+]/g, '').replace(/\+/g, '')
    const text = `Hola ${coachName}, soy ${studentName}. Olvidé mi contraseña de BoxPlan, ¿me la podés resetear?`
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`

    return NextResponse.json({
      whatsappUrl,
      studentName,
      coachName
    })
  } catch (error) {
    console.error('Error en forgot-password-whatsapp:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
