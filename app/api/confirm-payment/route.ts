import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { preference_id, external_reference, collection_id } = body

    console.log('[confirm-payment] Recibido:', { preference_id, external_reference, collection_id })

    let userId: number | null = null
    let planId: number | null = null
    let paymentRecord = null

    // 1. Intentar obtener userId y planId desde external_reference (más confiable)
    // Formato: subscription_${user_id}_${plan_id}_${timestamp}
    if (external_reference) {
      const parts = String(external_reference).split('_')
      console.log('[confirm-payment] Parseando external_reference:', parts)
      if (parts.length >= 3 && parts[0] === 'subscription') {
        userId = parseInt(parts[1], 10)
        planId = parseInt(parts[2], 10)
      }
    }

    // 2. Buscar paymentHistory por preference_id (para actualizarlo después)
    if (preference_id) {
      paymentRecord = await prisma.paymentHistory.findFirst({
        where: { mercadopagoPreferenceId: String(preference_id) },
        orderBy: { createdAt: 'desc' }
      })
      console.log('[confirm-payment] PaymentRecord por preference_id:', paymentRecord?.id)
    }

    // 3. Si no tenemos userId desde external_reference, usar el del paymentRecord
    if (!userId && paymentRecord) {
      userId = paymentRecord.userId
    }

    // 4. Fallback: si no hay preference_id ni external_reference, usar el usuario autenticado
    // y buscar su último paymentHistory pendiente (creado en los últimos 30 minutos)
    if (!userId) {
      userId = parseInt(String(session.user.id), 10)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      paymentRecord = await prisma.paymentHistory.findFirst({
        where: {
          userId,
          status: 'pending',
          createdAt: { gte: thirtyMinutesAgo }
        },
        orderBy: { createdAt: 'desc' }
      })
      console.log('[confirm-payment] Fallback paymentRecord:', paymentRecord?.id)
    }

    if (!userId || isNaN(userId)) {
      console.error('[confirm-payment] No se pudo determinar userId')
      return NextResponse.json(
        { error: 'No se pudo determinar el usuario del pago' },
        { status: 400 }
      )
    }

    // Verificar que el usuario autenticado sea el dueño del pago
    if (String(session.user.id) !== String(userId)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // 4. Buscar suscripción existente para renovar (si existe)
    // Buscar activas, expiradas o past_due para poder renovar la existente
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'expired', 'past_due'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    })

    // 5. Si no tenemos planId, intentar obtenerlo del paymentRecord
    if (!planId && paymentRecord?.subscriptionId) {
      const sub = await prisma.subscription.findUnique({
        where: { id: paymentRecord.subscriptionId },
        select: { planId: true }
      })
      if (sub) planId = sub.planId
    }

    // 6. Si todavía no tenemos planId, buscar el último paymentHistory del usuario
    if (!planId) {
      const lastPayment = await prisma.paymentHistory.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      if (lastPayment?.subscriptionId) {
        const sub = await prisma.subscription.findUnique({
          where: { id: lastPayment.subscriptionId },
          select: { planId: true }
        })
        if (sub) planId = sub.planId
      }
    }

    // 7. Fallback: usar el planId de la suscripción activa existente (renovaciones)
    if (!planId && existingSubscription) {
      planId = existingSubscription.planId
    }

    if (!planId || isNaN(planId)) {
      console.error('[confirm-payment] No se pudo determinar planId. userId:', userId)
      return NextResponse.json(
        { error: 'No se pudo determinar el plan del pago' },
        { status: 400 }
      )
    }

    // 7. Buscar el plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    // 8. Buscar el coach del estudiante
    const relationship = await prisma.coachStudentRelationship.findFirst({
      where: { studentId: userId, status: 'active' }
    })
    const coachId = relationship?.coachId ?? null

    // 9. Crear o renovar la suscripción
    const now = new Date()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + (plan.interval === 'year' ? 12 : 1))

    console.log('[confirm-payment] Creando/actualizando suscripción:', { userId, planId, coachId, existingId: existingSubscription?.id })

    const subscription = await prisma.$transaction(async (tx) => {
      const upsertedSubscription = existingSubscription
        ? await tx.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              planId,
              status: 'active',
              ...(coachId && { coachId }),
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              paymentMethod: 'mercadopago',
              cancelAtPeriodEnd: false
            }
          })
        : await tx.subscription.create({
            data: {
              userId,
              planId,
              status: 'active',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              paymentMethod: 'mercadopago',
              cancelAtPeriodEnd: false,
              ...(coachId && { coachId })
            }
          })

      // Actualizar el paymentHistory si existe
      if (paymentRecord) {
        await tx.paymentHistory.update({
          where: { id: paymentRecord.id },
          data: {
            status: 'approved',
            subscriptionId: upsertedSubscription.id
          }
        })
      } else if (preference_id) {
        // Crear un paymentHistory si no existía
        await tx.paymentHistory.create({
          data: {
            userId,
            subscriptionId: upsertedSubscription.id,
            amount: Number(plan.price),
            currency: plan.currency,
            status: 'approved',
            paymentMethod: 'mercadopago',
            mercadopagoPreferenceId: String(preference_id),
            recipientType: 'coach'
          }
        })
      }

      // Resetear preferencias para el nuevo período
      await tx.userPreference.updateMany({
        where: { userId },
        data: { lastPreferenceChangeDate: null }
      })

      return upsertedSubscription
    })

    console.log('[confirm-payment] Suscripción creada:', subscription.id)

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Suscripción activada correctamente'
    })
  } catch (error) {
    console.error('[confirm-payment] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al confirmar pago',
        success: false
      },
      { status: 500 }
    )
  }
}
