import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    const { error: updateError } = await supabase
      .from('payment_history')
      .update({
        status: payment.status === 'approved' ? 'approved' : 'rejected',
        mercadopago_payment_id: paymentId,
        updated_at: new Date().toISOString()
      })
      .eq('mercadopago_preference_id', payment.preference_id)

    if (updateError) {
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
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      // Update existing subscription
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_id,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          mercadopago_payment_id: payment.id,
          updated_at: now.toISOString()
        })
        .eq('id', existingSubscription.id)

      if (error) {
        console.error('Error updating subscription:', error)
      }
    } else {
      // Create new subscription
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id,
          plan_id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          mercadopago_payment_id: payment.id,
          cancel_at_period_end: false
        })

      if (error) {
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