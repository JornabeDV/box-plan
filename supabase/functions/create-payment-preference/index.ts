import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan_id, user_id, plan }: CreatePreferenceRequest = await req.json()

    if (!plan_id || !user_id || !plan) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get MercadoPago credentials
    const mercadopagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    
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
      back_urls: {
        success: `${Deno.env.get('SITE_URL')}/pricing?success=true`,
        failure: `${Deno.env.get('SITE_URL')}/pricing?failure=true`,
        pending: `${Deno.env.get('SITE_URL')}/pricing?pending=true`
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SITE_URL')}/api/webhooks/mercadopago`,
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

    return new Response(
      JSON.stringify({ 
        preference,
        success: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating payment preference:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})