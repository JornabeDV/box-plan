'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { normalizeUserId } from '@/lib/auth-helpers'

const CACHE_DURATION = 5 * 60 * 1000
const getCacheKey = (userId: string | number) => `plan_features_${userId}`

export type PlanificationAccess = 'weekly' | 'monthly' | 'unlimited'

export interface CoachPlanFeatures {
	dashboard_custom?: boolean
	/** Tipo de acceso a planificación: 'weekly' | 'monthly' | 'unlimited' */
	planification_access?: PlanificationAccess
	/** @deprecated Usar planification_access */
	planification_unlimited?: boolean
	/** @deprecated Usar planification_access */
	planification_monthly?: boolean
	/** @deprecated Usar planification_access */
	weekly_planification?: boolean
	max_disciplines?: number
	timer?: boolean
	score_loading?: boolean
	score_database?: boolean
	mercadopago_connection?: boolean
	whatsapp_integration?: boolean
	community_forum?: boolean
	custom_motivational_quotes?: boolean
	/** Permite crear planificaciones personalizadas para estudiantes específicos */
	personalized_planifications?: boolean
	/** Permite duplicar y replicar planificaciones a otros días */
	replicate_planifications?: boolean
}

export interface CoachPlanInfo {
	planId: number
	planName: string
	displayName: string
	slug: string
	features: CoachPlanFeatures
	maxStudents: number
	commissionRate: number
	maxStudentPlans: number
	maxStudentPlanTier: string
	isActive: boolean
	isTrial: boolean
}

interface UseCoachPlanFeaturesReturn {
	planInfo: CoachPlanInfo | null
	loading: boolean
	error: string | null
	hasFeature: (feature: keyof CoachPlanFeatures) => boolean
	maxDisciplines: number
	/** Acceso a planificación: 'weekly' | 'monthly' | 'unlimited' */
	planificationAccess: PlanificationAccess
	canLoadMonthlyPlanifications: boolean
	canLoadUnlimitedPlanifications: boolean
	/** @deprecated Usar planificationAccess */
	planificationWeeks: number
	canUseMercadoPago: boolean
	canUseWhatsApp: boolean
	canUseCommunityForum: boolean
	canLoadScores: boolean
	canAccessScoreDatabase: boolean
	/** Permite crear planificaciones personalizadas para estudiantes */
	canCreatePersonalizedPlanifications: boolean
	/** Permite duplicar y replicar planificaciones */
	canReplicatePlanifications: boolean
	/** Cantidad máxima de planes de alumnos que puede crear */
	maxStudentPlans: number
	/** Tier máximo de plan de alumno permitido */
	maxStudentPlanTier: string
	refetch: () => Promise<void>
}

/**
 * Obtiene el tipo de acceso a planificación del plan
 */
function getPlanificationAccess(features: CoachPlanFeatures | undefined): PlanificationAccess {
	if (!features) return 'weekly'
	
	// Si tiene el nuevo campo, usarlo
	if (features.planification_access) {
		return features.planification_access
	}

	// Sino, mapear desde campos legacy (daily se convierte a weekly)
	if (features.planification_unlimited) return 'unlimited'
	if (features.planification_monthly) return 'monthly'
	if (features.weekly_planification) return 'weekly'
	// daily legacy se convierte a weekly
	return 'weekly'
}

export function useCoachPlanFeatures(): UseCoachPlanFeaturesReturn {
	const { data: session } = useSession()
	const [planInfo, setPlanInfo] = useState<CoachPlanInfo | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const clearState = useCallback(() => {
		setPlanInfo(null)
		setLoading(false)
		setError(null)
	}, [])

	// Effect para cargar los datos del plan
	useEffect(() => {
		const userId = normalizeUserId(session?.user?.id)
		
		if (!userId) {
			clearState()
			return
		}

		let cancelled = false
		const abortController = new AbortController()

		// Funciones de caché dentro del effect
		const getCached = (): CoachPlanInfo | null => {
			if (typeof window === 'undefined') return null
			
			try {
				const cachedData = localStorage.getItem(getCacheKey(userId))
				if (!cachedData) return null
				
				const parsed = JSON.parse(cachedData)
				const cacheAge = Date.now() - (parsed.timestamp || 0)
				
				if (cacheAge < CACHE_DURATION && parsed.planInfo) {
					return parsed.planInfo
				}
				
				// Limpiar caché expirado
				localStorage.removeItem(getCacheKey(userId))
			} catch (e) {
				localStorage.removeItem(getCacheKey(userId))
			}
			
			return null
		}

		const setCache = (data: CoachPlanInfo) => {
			if (typeof window === 'undefined') return
			
			try {
				localStorage.setItem(getCacheKey(userId), JSON.stringify({
					planInfo: data,
					timestamp: Date.now()
				}))
			} catch (e) {
				console.error('Error saving plan features to cache:', e)
			}
		}

		async function loadPlanInfo() {
			// Verificar cache primero
			const cached = getCached()
			if (cached) {
				if (!cancelled) {
					setPlanInfo(cached)
					setLoading(false)
				}
				return
			}

			if (!cancelled) setLoading(true)
			if (!cancelled) setError(null)

			try {
				const response = await fetch('/api/coaches/plan-features', {
					signal: abortController.signal
				})

				if (!response.ok) {
					throw new Error(`Error ${response.status} al obtener información del plan`)
				}

				const data = await response.json()
				
				if (!cancelled && data.planInfo) {
					setPlanInfo(data.planInfo)
					setCache(data.planInfo)
				}
			} catch (err: any) {
				if (err.name === 'AbortError') {
					console.log('[useCoachPlanFeatures] Request aborted')
					return
				}
				
				console.error('Error fetching coach plan features:', err)
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Error desconocido')
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
				}
			}
		}

		loadPlanInfo()

		return () => {
			cancelled = true
			abortController.abort()
		}
	}, [session?.user?.id, clearState])

	const hasFeature = useCallback((feature: keyof CoachPlanFeatures): boolean => {
		return planInfo?.features[feature] === true
	}, [planInfo])

	const refetch = useCallback(async () => {
		const userId = normalizeUserId(session?.user?.id)
		if (!userId) return

		setLoading(true)
		setError(null)

		const abortController = new AbortController()

		try {
			const response = await fetch('/api/coaches/plan-features', {
				signal: abortController.signal
			})

			if (!response.ok) {
				throw new Error(`Error ${response.status} al obtener información del plan`)
			}

			const data = await response.json()
			
			if (data.planInfo) {
				setPlanInfo(data.planInfo)
				
				// Guardar en caché
				if (typeof window !== 'undefined') {
					try {
						localStorage.setItem(getCacheKey(userId), JSON.stringify({
							planInfo: data.planInfo,
							timestamp: Date.now()
						}))
					} catch (e) {
						console.error('Error saving plan features to cache:', e)
					}
				}
			}
		} catch (err: any) {
			if (err.name === 'AbortError') return
			
			console.error('Error refetching coach plan features:', err)
			setError(err instanceof Error ? err.message : 'Error desconocido')
		} finally {
			setLoading(false)
		}
	}, [session?.user?.id])

	const maxDisciplines = planInfo?.features.max_disciplines || 0
	const planificationAccess = getPlanificationAccess(planInfo?.features)
	const canLoadMonthlyPlanifications = planificationAccess === 'monthly' || planificationAccess === 'unlimited'
	const canLoadUnlimitedPlanifications = planificationAccess === 'unlimited'
	const planificationWeeks = planificationAccess === 'weekly' ? 1 : 0
	const canUseMercadoPago = hasFeature('mercadopago_connection')
	const canUseWhatsApp = hasFeature('whatsapp_integration')
	const canUseCommunityForum = hasFeature('community_forum')
	const canLoadScores = hasFeature('score_loading')
	const canAccessScoreDatabase = hasFeature('score_database')
	const canCreatePersonalizedPlanifications = hasFeature('personalized_planifications')
	const canReplicatePlanifications = hasFeature('replicate_planifications')
	const maxStudentPlans = planInfo?.maxStudentPlans || 2
	const maxStudentPlanTier = planInfo?.maxStudentPlanTier || 'basic'

	return {
		planInfo,
		loading,
		error,
		hasFeature,
		maxDisciplines,
		planificationAccess,
		canLoadMonthlyPlanifications,
		canLoadUnlimitedPlanifications,
		planificationWeeks,
		canUseMercadoPago,
		canUseWhatsApp,
		canUseCommunityForum,
		canLoadScores,
		canAccessScoreDatabase,
		canCreatePersonalizedPlanifications,
		canReplicatePlanifications,
		maxStudentPlans,
		maxStudentPlanTier,
		refetch
	}
}
