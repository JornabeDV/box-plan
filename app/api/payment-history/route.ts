import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCachedPaymentHistory } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id

		const paymentHistory = await getCachedPaymentHistory(userId)

		const response = NextResponse.json({ paymentHistory })
		response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
		return response
	} catch (error) {
		console.error('Error fetching payment history:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
