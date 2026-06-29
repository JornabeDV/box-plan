import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'
import { getCachedStudentCoach } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/student/coach
// Obtiene la información del coach asignado al estudiante
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		
		const userId = normalizeUserId(session?.user?.id)
		if (!userId) {
			return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
		}

		const result = await getCachedStudentCoach(userId)

		if (!result.data) {
			return NextResponse.json(result, { status: 404 })
		}

		const response = NextResponse.json(result)
		response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
		return response
	} catch (error) {
		console.error('Error fetching student coach:', error)
		return NextResponse.json(
			{ error: 'Error al cargar la información del coach' },
			{ status: 500 }
		)
	}
}
