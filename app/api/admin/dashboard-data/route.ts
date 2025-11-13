import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId } from '@/lib/auth-helpers'

// Forzar modo dinámico para evitar errores en build time
// Estas configuraciones aseguran que la ruta nunca se pre-renderice
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

/**
 * Endpoint combinado que trae todos los datos del dashboard en una sola petición
 * 
 * Query params opcionales:
 * - coachId: ID del coach (si no se proporciona, se obtiene del usuario autenticado)
 * - include: Lista separada por comas de qué cargar (disciplines,planifications,users,plans,access)
 *            Por defecto carga todo si no se especifica
 * 
 * Ejemplo: /api/admin/dashboard-data?coachId=1&include=disciplines,users
 */
export async function GET(request: NextRequest) {
	// Verificar que tenemos un request válido (no durante build)
	if (!request || typeof request.url === 'undefined') {
		return NextResponse.json(
			{ error: 'Service unavailable during build' },
			{ status: 503 }
		)
	}

	try {
		// Importación dinámica de helpers que usan Prisma (solo se ejecuta en runtime)
		const {
			loadDashboardDisciplines,
			loadDashboardPlanifications,
			loadDashboardUsers,
			loadDashboardSubscriptionPlans,
			calculateCoachAccess,
			getCoachIdFromUser,
			loadCoachProfile
		} = await import('@/lib/dashboard-helpers')

		const { getTrialDaysRemaining } = await import('@/lib/coach-helpers')

		const session = await auth()
		const { searchParams } = new URL(request.url)
		
		const userId = normalizeUserId(session?.user?.id)
		if (!userId) {
			return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
		}

		// Obtener coachId del query param o del usuario
		const coachIdParam = searchParams.get('coachId')
		let coachId: number | null = null

		if (coachIdParam) {
			coachId = parseInt(coachIdParam, 10)
		} else {
			coachId = await getCoachIdFromUser(userId)
		}

		if (!coachId) {
			return NextResponse.json({ error: 'No autorizado. Solo coaches pueden acceder.' }, { status: 403 })
		}

		// Obtener qué datos incluir (por defecto todos)
		const includeParam = searchParams.get('include')
		const includes = includeParam 
			? includeParam.split(',').map(i => i.trim())
			: ['all']

		const shouldInclude = (key: string) => includes.includes('all') || includes.includes(key)

		// Cargar coachProfile si se necesita para access
		const coachProfile = shouldInclude('access') 
			? await loadCoachProfile(coachId)
			: null

		if (shouldInclude('access') && !coachProfile) {
			return NextResponse.json({ error: 'Coach no encontrado' }, { status: 404 })
		}

		// Cargar datos en paralelo según lo solicitado
		const loadPromises: Array<{ key: string; promise: Promise<any> }> = []
		
		if (shouldInclude('disciplines')) {
			loadPromises.push({ key: 'disciplines', promise: loadDashboardDisciplines(coachId) })
		}
		
		if (shouldInclude('planifications')) {
			loadPromises.push({ key: 'planifications', promise: loadDashboardPlanifications(coachId) })
		}
		
		if (shouldInclude('users')) {
			loadPromises.push({ key: 'users', promise: loadDashboardUsers() })
		}
		
		if (shouldInclude('plans')) {
			loadPromises.push({ key: 'plans', promise: loadDashboardSubscriptionPlans(coachId) })
		}

		const results = await Promise.all(loadPromises.map(p => p.promise))
		
		// Mapear resultados a sus claves
		const resultsMap = new Map<string, any>()
		loadPromises.forEach(({ key }, index) => {
			resultsMap.set(key, results[index])
		})

		const disciplinesData = resultsMap.get('disciplines') || null
		const planificationsData = resultsMap.get('planifications') || null
		const usersData = resultsMap.get('users') || null
		const subscriptionPlansData = resultsMap.get('plans') || null

		// Calcular acceso del coach si se requiere
		let coachAccessData = null
		if (shouldInclude('access') && coachProfile) {
			const access = calculateCoachAccess(coachProfile)
			const daysRemaining = access.isTrial && access.trialEndsAt 
				? getTrialDaysRemaining(access.trialEndsAt)
				: 0

			coachAccessData = {
				hasAccess: access.hasAccess,
				isTrial: access.isTrial,
				trialEndsAt: access.trialEndsAt?.toISOString() || null,
				daysRemaining,
				subscription: access.subscription
			}
		}

		// Construir respuesta
		const response: any = {}

		if (disciplinesData) {
			response.disciplines = disciplinesData
		}

		if (planificationsData) {
			response.planifications = planificationsData
		}

		if (usersData) {
			response.users = usersData
		}

		if (subscriptionPlansData) {
			response.subscriptionPlans = subscriptionPlansData
		}

		if (coachAccessData) {
			response.coachAccess = coachAccessData
		}

		const httpResponse = NextResponse.json(response)
		
		// Agregar caché para reducir queries repetidas
		httpResponse.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=5')
		
		return httpResponse
	} catch (error) {
		console.error('Error fetching dashboard data:', error)
		return NextResponse.json(
			{ error: 'Error al cargar los datos del dashboard' },
			{ status: 500 }
		)
	}
}
