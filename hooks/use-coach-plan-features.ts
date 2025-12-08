'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { normalizeUserId } from '@/lib/auth-helpers'

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
 * Hook para obtener y usar las funcionalidades del plan del coach
 */
export function useCoachPlanFeatures(): UseCoachPlanFeaturesReturn {
	const { data: session } = useSession()
	const [planInfo, setPlanInfo] = useState<CoachPlanInfo | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchPlanInfo = async () => {
		try {
			setLoading(true)
			setError(null)

			const userId = normalizeUserId(session?.user?.id)
			if (!userId) {
				setPlanInfo(null)
				setLoading(false)
				return
			}

			// Determinar si es coach o estudiante
			const response = await fetch('/api/coaches/plan-features')
			if (!response.ok) {
				throw new Error('Error al obtener información del plan')
			}

			const data = await response.json()
			setPlanInfo(data.planInfo)
		} catch (err) {
			console.error('Error fetching coach plan features:', err)
			setError(err instanceof Error ? err.message : 'Error desconocido')
			setPlanInfo(null)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (session) {
			fetchPlanInfo()
		}
	}, [session])

	const hasFeature = (feature: keyof CoachPlanFeatures): boolean => {
		if (!planInfo) return false
		return planInfo.features[feature] === true
	}

	return {
		planInfo,
		loading,
		error,
		hasFeature,
		maxDisciplines: planInfo?.features.max_disciplines || 0,
		canLoadMonthlyPlanifications: planInfo?.features.planification_monthly === true || 
		                              planInfo?.features.planification_unlimited === true,
		canLoadUnlimitedPlanifications: planInfo?.features.planification_unlimited === true,
		planificationWeeks: planInfo?.features.planification_weeks || 0,
		canUseMercadoPago: hasFeature('mercadopago_connection'),
		canUseVirtualWallet: hasFeature('virtual_wallet'),
		canUseWhatsApp: hasFeature('whatsapp_integration'),
		canUseCommunityForum: hasFeature('community_forum'),
		canLoadScores: hasFeature('score_loading'),
		canAccessScoreDatabase: hasFeature('score_database'),
		refetch: fetchPlanInfo
	}
}
