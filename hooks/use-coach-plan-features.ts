'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { normalizeUserId } from '@/lib/auth-helpers'

const CACHE_DURATION = 5 * 60 * 1000
const getCacheKey = (userId: string | number) => `plan_features_${userId}`

export interface CoachPlanFeatures {
	dashboard_custom?: boolean
	daily_planification?: boolean
	planification_weeks?: number
	planification_monthly?: boolean
	planification_unlimited?: boolean
	max_disciplines?: number
	timer?: boolean
	score_loading?: boolean
	score_database?: boolean
	mercadopago_connection?: boolean
	virtual_wallet?: boolean
	whatsapp_integration?: boolean
	community_forum?: boolean
	custom_motivational_quotes?: boolean
}

export interface CoachPlanInfo {
	planId: number
	planName: string
	displayName: string
	features: CoachPlanFeatures
	maxStudents: number
	commissionRate: number
	isActive: boolean
	isTrial: boolean
}

interface UseCoachPlanFeaturesReturn {
	planInfo: CoachPlanInfo | null
	loading: boolean
	error: string | null
	hasFeature: (feature: keyof CoachPlanFeatures) => boolean
	maxDisciplines: number
	canLoadMonthlyPlanifications: boolean
	canLoadUnlimitedPlanifications: boolean
	planificationWeeks: number
	canUseMercadoPago: boolean
	canUseVirtualWallet: boolean
	canUseWhatsApp: boolean
	canUseCommunityForum: boolean
	canLoadScores: boolean
	canAccessScoreDatabase: boolean
	refetch: () => Promise<void>
}

/**
 * Hook to obtain and use the functionalities of the coach's plan
 */
export function useCoachPlanFeatures(): UseCoachPlanFeaturesReturn {
	const { data: session } = useSession()
	const [planInfo, setPlanInfo] = useState<CoachPlanInfo | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	
	const lastUserIdRef = useRef<string | number | undefined>(undefined)
	const fetchingRef = useRef(false)
	const abortControllerRef = useRef<AbortController | null>(null)

	const getCachedPlanInfo = useCallback((userId: string | number): CoachPlanInfo | null => {
		if (typeof window === 'undefined') return null
		
		try {
			const cachedData = localStorage.getItem(getCacheKey(userId))
			if (!cachedData) return null
			
			const parsed = JSON.parse(cachedData)
			const cacheAge = Date.now() - (parsed.timestamp || 0)
			
			if (cacheAge < CACHE_DURATION && parsed.planInfo) {
				return parsed.planInfo
			}
		} catch (e) {
			if (typeof window !== 'undefined') {
				localStorage.removeItem(getCacheKey(userId))
			}
		}
		
		return null
	}, [])

	const setCachedPlanInfo = useCallback((userId: string | number, data: CoachPlanInfo | null) => {
		if (typeof window === 'undefined' || !data) return
		
		try {
			localStorage.setItem(getCacheKey(userId), JSON.stringify({
				planInfo: data,
				timestamp: Date.now()
			}))
		} catch (e) {
			console.error('Error saving plan features to cache:', e)
		}
	}, [])

	const clearState = useCallback(() => {
		setPlanInfo(null)
		setLoading(false)
		setError(null)
		lastUserIdRef.current = undefined
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
			abortControllerRef.current = null
		}
	}, [])

	const fetchPlanInfo = useCallback(async (userId: string | number, useCache = true) => {
		console.log('[useCoachPlanFeatures] fetchPlanInfo called', { userId, useCache, fetching: fetchingRef.current })
		
		if (fetchingRef.current) {
			console.log('[useCoachPlanFeatures] Already fetching, returning')
			return
		}

		if (useCache) {
			const cached = getCachedPlanInfo(userId)
			console.log('[useCoachPlanFeatures] Cache check:', { cached: !!cached })
			if (cached) {
				setPlanInfo(cached)
				setLoading(false)
				lastUserIdRef.current = userId
				console.log('[useCoachPlanFeatures] Using cached data')
				return
			} else {
				setLoading(true)
			}
		} else {
			setLoading(true)
		}

		try {
			fetchingRef.current = true
			setError(null)

			if (abortControllerRef.current) {
				abortControllerRef.current.abort()
			}

			const abortController = new AbortController()
			abortControllerRef.current = abortController

			console.log('[useCoachPlanFeatures] Fetching from API...')
			const response = await fetch('/api/coaches/plan-features', {
				signal: abortController.signal
			})

			if (!response.ok) {
				throw new Error('Error al obtener información del plan')
			}

			const data = await response.json()
			console.log('[useCoachPlanFeatures] API response:', { planInfo: data.planInfo ? data.planInfo.planName : null })
			
			if (!abortController.signal.aborted) {
				console.log('[useCoachPlanFeatures] Setting planInfo:', data.planInfo)
				setPlanInfo(data.planInfo)
				if (data.planInfo) {
					setCachedPlanInfo(userId, data.planInfo)
				}
				lastUserIdRef.current = userId
			}
		} catch (err: any) {
			if (err.name === 'AbortError') {
				console.log('[useCoachPlanFeatures] Request aborted')
				return
			}
			
			console.error('Error fetching coach plan features:', err)
			setError(err instanceof Error ? err.message : 'Error desconocido')
			
			if (!getCachedPlanInfo(userId)) {
				setPlanInfo(null)
			}
		} finally {
			setLoading(false)
			fetchingRef.current = false
			abortControllerRef.current = null
			console.log('[useCoachPlanFeatures] Fetch complete')
		}
	}, [getCachedPlanInfo, setCachedPlanInfo])

	useEffect(() => {
		const userId = normalizeUserId(session?.user?.id)
		console.log('[useCoachPlanFeatures] Effect triggered', { userId, lastUserId: lastUserIdRef.current, planInfo: planInfo ? planInfo.planName : null })
		
		if (!userId) {
			if (lastUserIdRef.current !== undefined) {
				clearState()
			}
			return
		}
		
		// Si el userId cambió, siempre hacer fetch
		if (userId !== lastUserIdRef.current) {
			fetchPlanInfo(userId, true)
			return
		}
		
		// Si es el mismo userId pero no hay planInfo, hacer fetch
		if (userId === lastUserIdRef.current && planInfo === null) {
			fetchPlanInfo(userId, true)
		}
	}, [session?.user?.id, planInfo, fetchPlanInfo, clearState])

	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort()
			}
		}
	}, [])

	const hasFeature = useCallback((feature: keyof CoachPlanFeatures): boolean => {
		return planInfo?.features[feature] === true
	}, [planInfo])

	const refetch = useCallback(async () => {
		const userId = normalizeUserId(session?.user?.id)
		if (userId) {
			await fetchPlanInfo(userId, false)
		}
	}, [session?.user?.id, fetchPlanInfo])

	const maxDisciplines = planInfo?.features.max_disciplines || 0
	const canLoadMonthlyPlanifications = planInfo?.features.planification_monthly === true || 
	                                     planInfo?.features.planification_unlimited === true
	const canLoadUnlimitedPlanifications = planInfo?.features.planification_unlimited === true
	const planificationWeeks = planInfo?.features.planification_weeks || 0
	const canUseMercadoPago = hasFeature('mercadopago_connection')
	const canUseVirtualWallet = hasFeature('virtual_wallet')
	const canUseWhatsApp = hasFeature('whatsapp_integration')
	const canUseCommunityForum = hasFeature('community_forum')
	const canLoadScores = hasFeature('score_loading')
	const canAccessScoreDatabase = hasFeature('score_database')

	return {
		planInfo,
		loading,
		error,
		hasFeature,
		maxDisciplines,
		canLoadMonthlyPlanifications,
		canLoadUnlimitedPlanifications,
		planificationWeeks,
		canUseMercadoPago,
		canUseVirtualWallet,
		canUseWhatsApp,
		canUseCommunityForum,
		canLoadScores,
		canAccessScoreDatabase,
		refetch
	}
}
