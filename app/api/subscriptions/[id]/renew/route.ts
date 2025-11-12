import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

// PATCH /api/subscriptions/[id]/renew
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const subscriptionId = parseInt(params.id, 10)

    // Extender el período y crear registro de pago en una transacción
    const newEndDate = new Date()
    newEndDate.setDate(newEndDate.getDate() + 30)

    await prisma.$transaction(async (tx) => {
      // Obtener la suscripción con el plan
      const subscription = await tx.subscription.findUnique({
        where: {
          id: subscriptionId,
          userId
        },
        include: {
          plan: {
            select: {
              price: true,
              currency: true
            }
          }
        }
      })

      if (!subscription) {
        throw new Error('Suscripción no encontrada')
      }

      // Actualizar suscripción
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodEnd: newEndDate,
          status: 'active'
        }
      })

      // Crear registro de pago
      await tx.paymentHistory.create({
        data: {
          userId,
          subscriptionId,
          amount: subscription.plan.price,
          currency: subscription.plan.currency,
          status: 'approved',
          mercadopagoPaymentId: `renewal_${Date.now()}`,
          paymentMethod: 'mercadopago'
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error renewing subscription:', error)
    return NextResponse.json(
      { error: 'Error al renovar suscripción' },
      { status: 500 }
    )
  }
}