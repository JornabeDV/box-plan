import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify the webhook signature (optional but recommended)
    const signature = request.headers.get('x-signature')
    if (!signature) {
      console.error('No signature provided')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Process different types of notifications
    if (body.type === 'payment') {
      await handlePaymentNotification(body.data)
    } else if (body.type === 'subscription') {
      await handleSubscriptionNotification(body.data)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentNotification(paymentId: string) {
  try {
    // Get payment details from MercadoPago
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!mpAccessToken) {
      throw new Error('MercadoPago access token not configured')
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch payment details: ${response.status}`)
    }

    const payment = await response.json()

    // Update payment history
    try {
      await prisma.paymentHistory.updateMany({
        where: {
          mercadopagoPreferenceId: payment.preference_id
        },
        data: {
          status: payment.status === 'approved' ? 'approved' : 'rejected',
          mercadopagoPaymentId: paymentId
        }
      })
    } catch (updateError) {
      console.error('Error updating payment history:', updateError)
      return
    }

    // If payment is approved, create or update subscription
    if (payment.status === 'approved') {
      await createOrUpdateSubscription(payment)
    }

  } catch (error) {
    console.error('Error handling payment notification:', error)
  }
}

async function createOrUpdateSubscription(payment: any) {
  try {
    const { user_id, plan_id } = payment.metadata || {}
    
    if (!user_id || !plan_id) {
      console.error('Missing user_id or plan_id in payment metadata')
      return
    }

    // Calculate subscription period
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1) // Default to monthly

    const userId = parseInt(user_id)
    const planId = parseInt(plan_id)

    // Check if user already has an active subscription
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      }
    })

    if (existing) {
      // Update existing subscription
      try {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            planId,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            mercadopagoPaymentId: payment.id.toString(),
            paymentMethod: 'mercadopago' // Actualizar método de pago a MercadoPago
          }
        })
      } catch (error) {
        console.error('Error updating subscription:', error)
      }
    } else {
      // Create new subscription
      try {
        await prisma.subscription.create({
          data: {
            userId,
            planId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            mercadopagoPaymentId: payment.id.toString(),
            paymentMethod: 'mercadopago', // Método de pago desde MercadoPago
            cancelAtPeriodEnd: false
          }
        })
      } catch (error) {
        console.error('Error creating subscription:', error)
      }
    }

  } catch (error) {
    console.error('Error creating/updating subscription:', error)
  }
}

async function handleSubscriptionNotification(subscriptionId: string) {
  try {
    // Handle subscription-specific notifications
    // This would be used for recurring payments, cancellations, etc.
    console.log('Subscription notification received:', subscriptionId)
  } catch (error) {
    console.error('Error handling subscription notification:', error)
  }
}