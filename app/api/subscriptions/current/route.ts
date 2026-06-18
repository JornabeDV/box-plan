import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { getCachedCurrentSubscription } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/subscriptions/current
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		if (!userId) {
			return NextResponse.json(
				{ error: 'No autenticado' },
				{ status: 401 }
			)
		}

		const result = await getCachedCurrentSubscription(userId)

		const response = NextResponse.json(result)
		response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
		return response
	} catch (error) {
		console.error('Error fetching current subscription:', error)
		return NextResponse.json(
			{ error: 'Error al cargar la suscripción' },
			{ status: 500 }
		)
	}
}
