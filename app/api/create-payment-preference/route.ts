import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
}

interface CreatePreferenceRequest {
  plan_id: string
  user_id: string
  plan: Plan
}

export async function OPTIONS() {
  return new Response('ok', { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const { plan_id, user_id, plan }: CreatePreferenceRequest = await request.json()

    if (!plan_id || !user_id || !plan) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get MercadoPago credentials
    const mercadopagoAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    
    if (!mercadopagoAccessToken) {
      throw new Error('MercadoPago access token not configured')
    }

    // Create preference in MercadoPago
    const preferenceData = {
      items: [
        {
          id: plan_id,
          title: `CrossFit Pro - ${plan.name}`,
          description: `Suscripción ${plan.interval === 'month' ? 'mensual' : 'anual'} al plan ${plan.name}`,
          quantity: 1,
          unit_price: plan.price,
          currency_id: plan.currency === 'USD' ? 'USD' : 'ARS'
        }
      ],
      payer: {
        // We'll get user info from Supabase
      },
      // back_urls: {
      //   success: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?success=true`,
      //   failure: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?failure=true`,
      //   pending: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?pending=true`
      // },
      // auto_return: 'all',
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`,
      external_reference: `subscription_${user_id}_${plan_id}_${Date.now()}`,
      metadata: {
        user_id,
        plan_id,
        plan_name: plan.name,
        interval: plan.interval
      }
    }

    // Get user info from Supabase
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user_id)
      .single()

    if (userError) {
      throw new Error(`Error fetching user data: ${userError.message}`)
    }

    if (userData) {
      preferenceData.payer = {
        email: userData.email,
        name: userData.full_name || userData.email
      }
    }

    // Create preference in MercadoPago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadopagoAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData)
    })

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text()
      throw new Error(`MercadoPago API error: ${mpResponse.status} - ${errorData}`)
    }

    const preference = await mpResponse.json()

    // Store the preference in our database for tracking
    const { error: dbError } = await supabase
      .from('payment_history')
      .insert({
        user_id,
        amount: plan.price,
        currency: plan.currency,
        status: 'pending',
        mercadopago_preference_id: preference.id,
        payment_method: 'mercadopago'
      })

    if (dbError) {
      console.error('Error storing payment history:', dbError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json(
      { 
        preference,
        success: true 
      },
      { 
        status: 200, 
        headers: corsHeaders 
      }
    )

  } catch (error) {
    console.error('Error creating payment preference:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { 
        status: 500, 
        headers: corsHeaders 
      }
    )
  }
}