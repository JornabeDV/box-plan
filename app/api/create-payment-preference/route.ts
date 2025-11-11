import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    // Verificar autenticación primero
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { plan_id, user_id, plan }: CreatePreferenceRequest = await request.json()

    if (!plan_id || !user_id || !plan) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verificar que el user_id de la request coincida con el usuario autenticado
    const sessionUserId = typeof session.user.id === 'string' ? session.user.id : String(session.user.id)
    if (sessionUserId !== user_id) {
      return NextResponse.json(
        { error: 'Usuario no autorizado' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get MercadoPago credentials
    const mercadopagoAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    
    if (!mercadopagoAccessToken) {
      throw new Error('MercadoPago access token not configured')
    }

    // Obtener email y nombre de la sesión (más confiable que consultar DB)
    const userEmail = session.user.email || ''
    const userName = session.user.name || userEmail

    // Create preference in MercadoPago
    const preferenceData = {
      items: [
        {
          id: plan_id,
          title: `Box Plan - ${plan.name}`,
          description: `Suscripción ${plan.interval === 'month' ? 'mensual' : 'anual'} al plan ${plan.name}`,
          quantity: 1,
          unit_price: plan.price,
          currency_id: plan.currency === 'USD' ? 'USD' : 'ARS'
        }
      ],
      payer: {
        email: userEmail,
        name: userName
      },
      // back_urls: {
      //   success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?success=true`,
      //   failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?failure=true`,
      //   pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?pending=true`
      // },
      // auto_return: 'all',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`,
      external_reference: `subscription_${user_id}_${plan_id}_${Date.now()}`,
      metadata: {
        user_id,
        plan_id,
        plan_name: plan.name,
        interval: plan.interval
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
    try {
      await prisma.paymentHistory.create({
        data: {
          userId: parseInt(user_id),
          amount: plan.price,
          currency: plan.currency,
          status: 'pending',
          mercadopagoPreferenceId: preference.id,
          paymentMethod: 'mercadopago'
        }
      })
    } catch (dbError) {
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