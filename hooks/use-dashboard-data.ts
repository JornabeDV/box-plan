'use client'

import { useState, useEffect, useRef } from 'react'

export interface DashboardData {
	disciplines: {
		disciplines: any[]
		levels: any[]
	}
	planifications: any[]
	users: any[]
	subscriptionPlans: any[]
	coachAccess: {
		hasAccess: boolean
		isTrial: boolean
		trialEndsAt: string | null
		daysRemaining: number
		subscription: any | null
	}
}

export function useDashboardData(coachId: string | null) {
	const [data, setData] = useState<DashboardData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const loadingRef = useRef(false)
	const lastCoachIdRef = useRef<string | null>(null)
	const hasDataRef = useRef(false)

	const loadDashboardData = async () => {
		if (!coachId) {
			setLoading(false)
			return
		}

		// Evitar llamadas duplicadas
		if (loadingRef.current) return
		if (lastCoachIdRef.current === coachId && hasDataRef.current) return

		loadingRef.current = true
		lastCoachIdRef.current = coachId
		setLoading(true)
		setError(null)

		try {
			const response = await fetch(`/api/admin/dashboard-data?coachId=${coachId}`, {
				cache: 'default'
			})

			if (!response.ok) {
				throw new Error('Error al cargar datos del dashboard')
			}

			const dashboardData = await response.json()
			setData(dashboardData)
			hasDataRef.current = true
		} catch (err) {
			console.error('Error loading dashboard data:', err)
			setError(err instanceof Error ? err.message : 'Error al cargar datos del dashboard')
			lastCoachIdRef.current = null
			hasDataRef.current = false
		} finally {
			setLoading(false)
			loadingRef.current = false
		}
	}

	useEffect(() => {
		// Resetear cuando cambia el coachId
		if (lastCoachIdRef.current !== coachId) {
			hasDataRef.current = false
		}
		loadDashboardData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [coachId])

	const refresh = () => {
		hasDataRef.current = false
		loadDashboardData()
	}

	return {
		data,
		loading,
		error,
		refresh,
		// Accesores directos para facilitar el uso
		disciplines: data?.disciplines?.disciplines || [],
		disciplineLevels: data?.disciplines?.levels || [],
		planifications: data?.planifications || [],
		users: data?.users || [],
		subscriptionPlans: data?.subscriptionPlans || [],
		coachAccess: data?.coachAccess || null
	}
}