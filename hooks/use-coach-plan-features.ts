'use client'

import { useState, useEffect, useCallback } from 'react'
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