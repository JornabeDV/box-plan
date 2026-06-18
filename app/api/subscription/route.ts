import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { getCachedSubscription } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const subscription = await getCachedSubscription(userId)

		const response = NextResponse.json(subscription)
		response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
		return response
	} catch (error) {
		console.error('Error fetching subscription:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
