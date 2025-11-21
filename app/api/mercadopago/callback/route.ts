import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, OAuth } from 'mercadopago'

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) return envUrl.replace(/\/$/, '')
  
  const requestUrl = new URL(request.url)
  const protocol = requestUrl.hostname === 'localhost' ? 'http' : requestUrl.protocol.replace(':', '')
  return `${protocol}://${requestUrl.host}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const baseUrl = getBaseUrl(request)

    if (error) {
      return NextResponse.redirect(`${baseUrl}/admin-dashboard?mercadopago_error=${encodeURIComponent(error)}&tab=plans`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/admin-dashboard?mercadopago_error=missing_params&tab=plans`)
    }

    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(`${baseUrl}/admin-dashboard?mercadopago_error=invalid_state&tab=plans`)
    }

    const clientId = process.env.MERCADOPAGO_CLIENT_ID
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET
    const redirectUri = `${baseUrl}/api/mercadopago/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/admin-dashboard?mercadopago_error=config_error&tab=plans`)
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
    const oauth = new OAuth(client)

    const credentials = await oauth.create({
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      }
    })

    const accessToken = credentials.access_token
    if (!accessToken) {
      return NextResponse.redirect(`${baseUrl}/admin-dashboard?mercadopago_error=no_access_token&tab=plans`)
    }

    const userResponse = await fetch('https://api.mercadopago.com/users/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/admin-dashboard?mercadopago_error=user_info_error&tab=plans`)
    }

    const userData = await userResponse.json()
    const platformAccountId = process.env.MERCADOPAGO_PLATFORM_ACCOUNT_ID
    
    let accountId = userData.id?.toString() || userData.account_id?.toString() || userData.user_id?.toString()
    
    if (accountId === platformAccountId) {
      if (credentials.user_id) {
        accountId = credentials.user_id.toString()
      }
      if (accountId === platformAccountId) {
        return NextResponse.redirect(`${baseUrl}/admin-dashboard?mercadopago_error=platform_account_id_mismatch&tab=plans`)
      }
    }

    if (!accountId) {
      return NextResponse.redirect(`${baseUrl}/admin-dashboard?mercadopago_error=no_account_id&tab=plans`)
    }

    await prisma.coachProfile.update({
      where: { id: stateData.coachId },
      data: { 
        mercadopagoAccountId: accountId,
        mercadoPagoAccessToken: accessToken
      } as any
    })

    return NextResponse.redirect(`${baseUrl}/admin-dashboard?mercadopago_connected=true&tab=plans`)

  } catch (error) {
    console.error('Error en callback MercadoPago:', error)
    const baseUrl = getBaseUrl(request)
    const errorMessage = error instanceof Error 
      ? error.message.substring(0, 50).replace(/[^a-zA-Z0-9_]/g, '_')
      : 'unknown_error'
    
    return NextResponse.redirect(`${baseUrl}/admin-dashboard?mercadopago_error=${errorMessage}&tab=plans`)
  }
}