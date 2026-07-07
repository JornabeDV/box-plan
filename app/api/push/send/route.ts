import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId, isCoach, isAnyAdmin } from '@/lib/auth-server-helpers'
import { sendPushNotification, type PushPayload } from '@/lib/push-notifications'

// POST /api/push/send — envía una notificación push
// Body: { userId?: number, userIds?: number[], title, body, icon?, url? }
// Solo coaches y admins pueden enviar notificaciones
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const senderId = normalizeUserId(session?.user?.id)
    if (!senderId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Validar rol desde la base de datos, no solo del token JWT
    const [coachCheck, adminCheck] = await Promise.all([
      isCoach(senderId),
      isAnyAdmin(senderId)
    ])

    if (!coachCheck.isAuthorized && !adminCheck) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, userIds, title, body: notifBody, icon, url } = body as {
      userId?: number
      userIds?: number[]
      title: string
      body: string
      icon?: string
      url?: string
    }

    if (!title || !notifBody) {
      return NextResponse.json({ error: 'title y body son requeridos' }, { status: 400 })
    }

    // Determinar a qué usuarios enviar
    const targetIds: number[] = []
    if (userId) targetIds.push(userId)
    if (userIds) targetIds.push(...userIds)

    // Solo administradores pueden hacer broadcast; coaches deben especificar destinatarios
    if (targetIds.length === 0 && !adminCheck) {
      return NextResponse.json({ error: 'Debe especificar destinatarios' }, { status: 400 })
    }

    // Si es coach, verificar que todos los destinatarios sean sus estudiantes
    if (coachCheck.isAuthorized && !adminCheck && targetIds.length > 0) {
      const relationships = await prisma.coachStudentRelationship.findMany({
        where: {
          coachId: coachCheck.profile!.id,
          studentId: { in: targetIds },
          status: 'active'
        },
        select: { studentId: true }
      })

      const allowedStudentIds = new Set(relationships.map(r => r.studentId))
      const unauthorizedTargets = targetIds.filter(id => !allowedStudentIds.has(id))

      if (unauthorizedTargets.length > 0) {
        return NextResponse.json(
          { error: 'No autorizado para enviar notificaciones a algunos usuarios' },
          { status: 403 }
        )
      }
    }

    const whereClause = targetIds.length > 0
      ? { userId: { in: targetIds } }
      : {}

    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'Sin suscriptores' })
    }

    const payload: PushPayload = { title, body: notifBody, icon, url }
    const staleEndpoints: string[] = []

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushNotification({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload)
      )
    )

    // Limpiar suscripciones caducadas (410 Gone)
    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.error === 'gone') {
        staleEndpoints.push(subscriptions[i].endpoint)
      }
    })

    if (staleEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: staleEndpoints } },
      })
    }

    const sent = results.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length

    return NextResponse.json({ success: true, sent, total: subscriptions.length })
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json({ error: 'Error al enviar notificación' }, { status: 500 })
  }
}
