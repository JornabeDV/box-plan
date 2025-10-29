import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

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
      await sql`
        UPDATE payment_history 
        SET status = ${payment.status === 'approved' ? 'approved' : 'rejected'}, 
            mercadopago_payment_id = ${paymentId}, 
            updated_at = NOW()
        WHERE mercadopago_preference_id = ${payment.preference_id}
      `
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

    // Check if user already has an active subscription
    const existing = await sql`
      SELECT * FROM subscriptions WHERE user_id = ${user_id} AND status = 'active'
    `

    if (existing.length > 0) {
      // Update existing subscription
      try {
        await sql`
          UPDATE subscriptions
          SET plan_id = ${plan_id}, 
              current_period_start = ${now.toISOString()}, 
              current_period_end = ${periodEnd.toISOString()}, 
              mercadopago_payment_id = ${payment.id}, 
              updated_at = NOW()
          WHERE id = ${existing[0].id}
        `
      } catch (error) {
        console.error('Error updating subscription:', error)
      }
    } else {
      // Create new subscription
      try {
        await sql`
          INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end, mercadopago_payment_id, cancel_at_period_end)
          VALUES (${user_id}, ${plan_id}, 'active', ${now.toISOString()}, ${periodEnd.toISOString()}, ${payment.id}, false)
        `
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