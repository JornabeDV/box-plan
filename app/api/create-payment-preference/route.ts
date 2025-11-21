import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Preference } from 'mercadopago'

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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401, headers: corsHeaders })
    }

    const { plan_id, user_id, plan }: CreatePreferenceRequest = await request.json()
    if (!plan_id || !user_id || !plan) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400, headers: corsHeaders })
    }

    if (String(session.user.id) !== user_id) {
      return NextResponse.json({ error: 'Usuario no autorizado' }, { status: 403, headers: corsHeaders })
    }

    const planIdNum = parseInt(plan_id, 10)
    const dbPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planIdNum },
      include: { coach: true }
    })

    if (!dbPlan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404, headers: corsHeaders })
    }

    const coach = dbPlan.coach
    const coachAccessToken = (coach as any).mercadoPagoAccessToken
    if (!coach || !coach.mercadopagoAccountId || !coachAccessToken) {
      return NextResponse.json({ error: 'Coach no autorizado para recibir pagos' }, { status: 400, headers: corsHeaders })
    }

    const planPrice = Number(plan.price)
    if (isNaN(planPrice) || planPrice <= 0) {
      return NextResponse.json({ error: 'Precio del plan inválido' }, { status: 400, headers: corsHeaders })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const platformCommissionRate = Number(coach.platformCommissionRate) || 0
    const marketplaceFee = (planPrice * platformCommissionRate) / 100
    const collectorId = parseInt(String(coach.mercadopagoAccountId).trim(), 10)

    if (isNaN(collectorId)) {
      throw new Error('Coach Account ID inválido')
    }

    const client = new MercadoPagoConfig({ accessToken: coachAccessToken })
    const preference = await new Preference(client).create({
      body: {
        items: [{
          id: plan_id,
          title: `Box Plan - ${plan.name}`,
          description: `Suscripción ${plan.interval === 'month' ? 'mensual' : 'anual'} al plan ${plan.name}`,
          quantity: 1,
          unit_price: planPrice,
          currency_id: plan.currency === 'USD' ? 'USD' : 'ARS'
        }],
        payer: {
          email: session.user.email || '',
          name: session.user.name || session.user.email || ''
        },
        collector_id: collectorId,
        marketplace_fee: marketplaceFee,
        back_urls: {
          success: `${baseUrl}/subscription?success=true`,
          failure: `${baseUrl}/subscription?failure=true`,
          pending: `${baseUrl}/subscription?pending=true`
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        external_reference: `subscription_${user_id}_${plan_id}_${Date.now()}`,
        metadata: {
          user_id,
          plan_id,
          plan_name: plan.name,
          interval: plan.interval,
          coach_id: String(dbPlan.coachId)
        }
      } as any
    })

    await prisma.paymentHistory.create({
      data: {
        userId: parseInt(user_id),
        amount: planPrice,
        currency: plan.currency,
        status: 'pending',
        mercadopagoPreferenceId: preference.id!,
        paymentMethod: 'mercadopago',
        recipientType: 'coach'
      }
    })

    return NextResponse.json({ preference, success: true }, { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('Error creating payment preference:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', success: false },
      { status: 500, headers: corsHeaders }
    )
  }
}