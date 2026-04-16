import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
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

    const role = (session?.user as any)?.role
    if (!['coach', 'admin', 'superadmin'].includes(role)) {
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

    const whereClause = targetIds.length > 0
      ? { userId: { in: targetIds } }
      : {} // sin filtro = enviar a todos (broadcast)

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
