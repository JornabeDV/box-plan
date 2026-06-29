import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { getCachedUserCoach } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/user-coach
 * Obtiene el coach asignado al usuario autenticado
 */
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

		const result = await getCachedUserCoach(userId)
		const response = NextResponse.json(result)
		response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
		return response
	} catch (error) {
		console.error('Error fetching user coach:', error)
		return NextResponse.json(
			{ error: 'Error al cargar la información del coach' },
			{ status: 500 }
		)
	}
}
