import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
}

export interface PushSubscriptionKeys {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionKeys,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? '/icon-192.png',
        url: payload.url ?? '/',
      })
    )
    return { success: true }
  } catch (err: any) {
    // 410 Gone = suscripción expirada, hay que eliminarla
    return { success: false, error: err?.statusCode === 410 ? 'gone' : String(err) }
  }
}

import { prisma } from './prisma'

/**
 * Envía notificaciones push a uno o varios usuarios.
 * Limpia automáticamente las suscripciones caducadas (410 Gone).
 */
export async function sendPushToUsers(
  userIds: number | number[],
  payload: PushPayload
): Promise<{ sent: number; total: number; cleaned: number }> {
  const ids = Array.isArray(userIds) ? userIds : [userIds]
  if (ids.length === 0) return { sent: 0, total: 0, cleaned: 0 }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: ids } },
  })

  if (subscriptions.length === 0) return { sent: 0, total: 0, cleaned: 0 }

  const staleEndpoints: string[] = []

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
    )
  )

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

  const sent = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length

  return { sent, total: subscriptions.length, cleaned: staleEndpoints.length }
}

export { webpush }
