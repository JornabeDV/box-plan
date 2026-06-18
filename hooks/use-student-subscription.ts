'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useCallback } from 'react'
import { normalizeUserId } from '@/lib/auth-helpers'

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
	planPrice: number
	planCurrency: string
	planInterval: string
	status: string
	isExpired: boolean
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
	isExpired: boolean
	refetch: () => Promise<void>
}

const STUDENT_SUBSCRIPTION_KEY = 'student-subscription'

async function fetchStudentSubscription(): Promise<StudentSubscriptionInfo | null> {
	const response = await fetch('/api/subscriptions/current')

	if (!response.ok) {
		throw new Error(`Error ${response.status} al obtener suscripción`)
	}

	const data = await response.json()

	if (!data.data) {
		return null
	}

	return {
		subscriptionId: data.data.id,
		planId: data.data.plan_id,
		planName: data.data.subscription_plans?.name || '',
		planPrice: data.data.subscription_plans?.price || 0,
		planCurrency: data.data.subscription_plans?.currency || 'ARS',
		planInterval: data.data.subscription_plans?.interval || 'month',
		status: data.data.status,
		isExpired: data.data.is_expired ?? false,
		features: data.data.subscription_plans?.features || {},
		planificationAccess: data.data.subscription_plans?.planificationAccess || 'weekly',
		currentPeriodStart: data.data.current_period_start,
		currentPeriodEnd: data.data.current_period_end,
	}
}

export function useStudentSubscription(): UseStudentSubscriptionReturn {
	const { data: session, status: sessionStatus } = useSession()
	const queryClient = useQueryClient()
	const userId = normalizeUserId(session?.user?.id)

	const { data: subscription, isLoading, error, refetch } = useQuery({
		queryKey: [STUDENT_SUBSCRIPTION_KEY, userId],
		queryFn: fetchStudentSubscription,
		enabled: sessionStatus !== 'loading' && !!userId,
		// Los datos de suscripción son relativamente estables, 5 minutos de stale time
		staleTime: 1000 * 60 * 5,
	})

	const refetchSubscription = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: [STUDENT_SUBSCRIPTION_KEY, userId] })
		await refetch()
	}, [queryClient, userId, refetch])

	const hasFeature = useCallback((feature: keyof StudentSubscriptionFeatures): boolean => {
		return subscription?.features[feature] === true
	}, [subscription])

	const isExpired = subscription?.isExpired ?? false
	const isSubscribed = subscription?.status === 'active' && !isExpired

	return {
		subscription: subscription ?? null,
		loading: isLoading,
		error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
		hasFeature,
		canViewRanking: hasFeature('leaderboardAccess'),
		canTrackProgress: hasFeature('progressTracking'),
		canAccessCommunity: hasFeature('communityAccess'),
		canUseWhatsAppSupport: hasFeature('whatsappSupport'),
		canUseTimer: isSubscribed,
		hasPersonalizedWorkouts: hasFeature('personalizedWorkouts'),
		planificationAccess: subscription?.planificationAccess || 'weekly',
		isSubscribed,
		isExpired,
		refetch: refetchSubscription,
	}
}
