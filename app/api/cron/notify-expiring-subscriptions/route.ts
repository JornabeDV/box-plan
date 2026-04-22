import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPushToUsers } from '@/lib/push-notifications'

function getDayRange(daysFromNow: number): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysFromNow, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysFromNow, 23, 59, 59, 999)
  return { start, end }
}

function formatExpiryDate(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
  })
}

async function notifyExpiringSubscriptions(
  daysBefore: number,
  title: string,
  getBody: (planName: string, expiryDate: string) => string
) {
  const { start, end } = getDayRange(daysBefore)

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: {
        gte: start,
        lte: end,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      plan: {
        select: {
          name: true,
        },
      },
    },
  })

  if (subscriptions.length === 0) {
    return { count: 0, sent: 0 }
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const expiryDate = formatExpiryDate(sub.currentPeriodEnd)
      const body = getBody(sub.plan.name, expiryDate)

      const result = await sendPushToUsers(sub.user.id, {
        title,
        body,
        icon: '/icon-192.jpg',
        url: '/subscription',
      })

      return { userId: sub.user.id, planName: sub.plan.name, ...result }
    })
  )

  const sent = results.filter(
    (r) => r.status === 'fulfilled' && r.value.sent > 0
  ).length

  return { count: subscriptions.length, sent, results }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Cron Notify] CRON_SECRET no está configurado')
      return NextResponse.json(
        { error: 'CRON_SECRET no configurado' },
        { status: 500 }
      )
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron Notify] Intento de acceso no autorizado')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Notificar 3 días antes
    const threeDaysResult = await notifyExpiringSubscriptions(
      3,
      '⏰ Tu plan vence pronto',
      (planName, expiryDate) =>
        `Tu plan ${planName} vence el ${expiryDate}. Renovalo para no perder el acceso a tus entrenamientos.`
    )

    // Notificar 1 día antes
    const oneDayResult = await notifyExpiringSubscriptions(
      1,
      '⚠️ Tu plan vence mañana',
      (planName, expiryDate) =>
        `Tu plan ${planName} vence mañana ${expiryDate}. Renovalo ahora para seguir entrenando sin interrupciones.`
    )

    return NextResponse.json({
      success: true,
      threeDays: {
        checked: threeDaysResult.count,
        notified: threeDaysResult.sent,
      },
      oneDay: {
        checked: oneDayResult.count,
        notified: oneDayResult.sent,
      },
    })
  } catch (error) {
    console.error('[Cron Notify] Error al notificar suscripciones por vencer:', error)
    return NextResponse.json(
      {
        error: 'Error al procesar notificaciones',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export const POST = GET
