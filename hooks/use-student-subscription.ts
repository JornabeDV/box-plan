'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { normalizeUserId } from '@/lib/auth-helpers'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
const getCacheKey = (userId: string | number) => `student_subscription_${userId}`

export interface StudentSubscriptionFeatures {
	// Features que vienen del plan del coach
	whatsappSupport?: boolean        // coach: whatsapp_integration
	communityAccess?: boolean        // coach: community_forum
	progressTracking?: boolean       // coach: score_loading
	leaderboardAccess?: boolean      // coach: score_database
	timerAccess?: boolean            // coach: timer
	personalizedWorkouts?: boolean   // coach: personalized_planifications
}

export interface StudentSubscriptionInfo {
	subscriptionId: number
	planId: number
	planName: string
	status: string
	features: StudentSubscriptionFeatures
	planificationAccess: 'weekly' | 'monthly' | 'unlimited'
	currentPeriodStart: string
	currentPeriodEnd: string
}

interface UseStudentSubscriptionReturn {
	subscription: StudentSubscriptionInfo | null
	loading: boolean
	error: string | null
	hasFeature: (feature: keyof StudentSubscriptionFeatures) => boolean
	canViewRanking: boolean
	canTrackProgress: boolean
	canAccessCommunity: boolean
	canUseWhatsAppSupport: boolean
	canUseTimer: boolean
	hasPersonalizedWorkouts: boolean
	planificationAccess: 'weekly' | 'monthly' | 'unlimited'
	isSubscribed: boolean
	refetch: () => Promise<void>
}

export function useStudentSubscription(): UseStudentSubscriptionReturn {
	const { data: session } = useSession()
	const [subscription, setSubscription] = useState<StudentSubscriptionInfo | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const clearState = useCallback(() => {
		setSubscription(null)
		setLoading(false)
		setError(null)
	}, [])

	// Effect para cargar la suscripción
	useEffect(() => {
		const userId = normalizeUserId(session?.user?.id)
		
		if (!userId) {
			clearState()
			return
		}

		let cancelled = false
		const abortController = new AbortController()

		const getCached = (): StudentSubscriptionInfo | null => {
			if (typeof window === 'undefined') return null
			
			try {
				const cachedData = localStorage.getItem(getCacheKey(userId))
				if (!cachedData) return null
				
				const parsed = JSON.parse(cachedData)
				const cacheAge = Date.now() - (parsed.timestamp || 0)
				
				if (cacheAge < CACHE_DURATION && parsed.subscription) {
					return parsed.subscription
				}
				
				localStorage.removeItem(getCacheKey(userId))
			} catch (e) {
				localStorage.removeItem(getCacheKey(userId))
			}
			
			return null
		}

		const setCache = (data: StudentSubscriptionInfo) => {
			if (typeof window === 'undefined') return
			
			try {
				localStorage.setItem(getCacheKey(userId), JSON.stringify({
					subscription: data,
					timestamp: Date.now()
				}))
			} catch (e) {
				console.error('Error saving subscription to cache:', e)
			}
		}

		async function loadSubscription() {
			const cached = getCached()
			if (cached) {
				if (!cancelled) {
					setSubscription(cached)
					setLoading(false)
				}
				return
			}

			if (!cancelled) setLoading(true)
			if (!cancelled) setError(null)

			try {
				// Timestamp para evitar cache en Safari/iOS
				const timestamp = Date.now();
				const response = await fetch(`/api/subscriptions/current?_t=${timestamp}`, {
					signal: abortController.signal,
					headers: {
						'Cache-Control': 'no-cache, no-store, must-revalidate',
						'Pragma': 'no-cache',
					}
				})

				if (!response.ok) {
					throw new Error(`Error ${response.status} al obtener suscripción`)
				}

				const data = await response.json()
				
				if (!cancelled && data.data) {
					const subscriptionData: StudentSubscriptionInfo = {
						subscriptionId: data.data.id,
						planId: data.data.plan_id,
						planName: data.data.subscription_plans?.name || '',
						status: data.data.status,
						features: data.data.subscription_plans?.features || {},
						planificationAccess: data.data.subscription_plans?.planificationAccess || 'weekly',
						currentPeriodStart: data.data.current_period_start,
						currentPeriodEnd: data.data.current_period_end
					}
					setSubscription(subscriptionData)
					setCache(subscriptionData)
				}
			} catch (err: any) {
				if (err.name === 'AbortError') {
					console.log('[useStudentSubscription] Request aborted')
					return
				}
				
				console.error('Error fetching student subscription:', err)
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Error desconocido')
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
				}
			}
		}

		loadSubscription()

		return () => {
			cancelled = true
			abortController.abort()
		}
	}, [session?.user?.id, clearState])

	const hasFeature = useCallback((feature: keyof StudentSubscriptionFeatures): boolean => {
		return subscription?.features[feature] === true
	}, [subscription])

	const refetch = useCallback(async () => {
		const userId = normalizeUserId(session?.user?.id)
		if (!userId) return

		setLoading(true)
		setError(null)

		try {
			// Timestamp para evitar cache en Safari/iOS
			const timestamp = Date.now();
			const response = await fetch(`/api/subscriptions/current?_t=${timestamp}`, {
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Pragma': 'no-cache',
				}
			})

			if (!response.ok) {
				throw new Error(`Error ${response.status} al obtener suscripción`)
			}

			const data = await response.json()
			
			if (data.data) {
				const subscriptionData: StudentSubscriptionInfo = {
					subscriptionId: data.data.id,
					planId: data.data.plan_id,
					planName: data.data.subscription_plans?.name || '',
					status: data.data.status,
					features: data.data.subscription_plans?.features || {},
					planificationAccess: data.data.subscription_plans?.planificationAccess || 'weekly',
					currentPeriodStart: data.data.current_period_start,
					currentPeriodEnd: data.data.current_period_end
				}
				setSubscription(subscriptionData)
				
				if (typeof window !== 'undefined') {
					try {
						localStorage.setItem(getCacheKey(userId), JSON.stringify({
							subscription: subscriptionData,
							timestamp: Date.now()
						}))
					} catch (e) {
						console.error('Error saving subscription to cache:', e)
					}
				}
			}
		} catch (err: any) {
			console.error('Error refetching student subscription:', err)
			setError(err instanceof Error ? err.message : 'Error desconocido')
		} finally {
			setLoading(false)
		}
	}, [session?.user?.id])

	// Computed values
	const canViewRanking = hasFeature('leaderboardAccess')
	const canTrackProgress = hasFeature('progressTracking')
	const canAccessCommunity = hasFeature('communityAccess')
	const canUseWhatsAppSupport = hasFeature('whatsappSupport')

	const canUseTimer = subscription?.status === 'active' // Timer disponible si tiene suscripción activa
	const hasPersonalizedWorkouts = hasFeature('personalizedWorkouts')
	const isSubscribed = subscription?.status === 'active'
	const planificationAccess = subscription?.planificationAccess || 'weekly'

	return {
		subscription,
		loading,
		error,
		hasFeature,
		canViewRanking,
		canTrackProgress,
		canAccessCommunity,
		canUseWhatsAppSupport,

		canUseTimer,
		hasPersonalizedWorkouts,
		planificationAccess,
		isSubscribed,
		refetch
	}
}
