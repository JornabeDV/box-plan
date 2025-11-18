import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id

    const paymentHistory = await prisma.paymentHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Serializar los datos para el frontend
    const serializedHistory = paymentHistory.map((payment) => ({
      id: payment.id.toString(),
      user_id: payment.userId.toString(),
      subscription_id: payment.subscriptionId?.toString() || null,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
      mercadopago_payment_id: payment.mercadopagoPaymentId,
      mercadopago_preference_id: payment.mercadopagoPreferenceId,
      payment_method: payment.paymentMethod,
      created_at: payment.createdAt.toISOString(),
      updated_at: payment.updatedAt.toISOString()
    }))

    return NextResponse.json({ paymentHistory: serializedHistory })
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}