import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: Number(session.user.id) }
    })

    if (!coachProfile) {
      return NextResponse.json({ error: 'Solo los coaches pueden conectar su cuenta de MercadoPago' }, { status: 403 })
    }

    const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID || process.env.MERCADOPAGO_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: 'MERCADOPAGO_CLIENT_ID no configurado' }, { status: 500 })
    }

    const baseUrl = getBaseUrl(request)
    const redirectUri = `${baseUrl}/api/mercadopago/callback`
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      coachId: coachProfile.id,
      timestamp: Date.now()
    })).toString('base64')

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
    const oauth = new OAuth(client)

    const authUrl = oauth.getAuthorizationURL({
      options: {
        client_id: clientId,
        redirect_uri: redirectUri,
        state
      }
    })

    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('Error iniciando conexión con MercadoPago:', error)
    return NextResponse.json({ error: 'Error al conectar con MercadoPago' }, { status: 500 })
  }
}