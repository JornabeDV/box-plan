'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface Planification {
	id: string
	title: string
	description?: string
	date: string
	discipline_id: string | null
	discipline_level_id: string | null
	blocks?: Array<{
		id: string
		name: string
		description?: string
	}>
	estimatedDuration?: number
	isCompleted: boolean
	is_personalized?: boolean
	discipline?: {
		id: string
		name: string
		color?: string
	}
	discipline_level?: {
		id: string
		name: string
		description?: string
	}
}

interface UseAllTodayPlanificationsReturn {
	planifications: Planification[]
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
}

interface UseAllTodayPlanificationsOptions {
	enabled?: boolean
	date?: string
}

export function useAllTodayPlanifications(
	options?: UseAllTodayPlanificationsOptions
): UseAllTodayPlanificationsReturn {
	const { data: session, status: sessionStatus } = useSession()
	const [planifications, setPlanifications] = useState<Planification[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const enabled = options?.enabled !== false

	const fetchPlanifications = useCallback(async () => {
		const userId = session?.user?.id
		if (!userId) {
			setPlanifications([])
			setLoading(false)
			return
		}

		try {
			setLoading(true)
			setError(null)

			const dateParam = options?.date
			const query = dateParam
				? `?date=${dateParam}&_t=${Date.now()}`
				: `?_t=${Date.now()}`

			const response = await fetch(`/api/planifications/today-all${query}`, {
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Pragma': 'no-cache',
				},
			})

			if (!response.ok) {
				throw new Error('Error al cargar las planificaciones')
			}

			const data = await response.json()
			setPlanifications(data.data || [])
		} catch (err) {
			console.error('Error fetching today-all planifications:', err)
			setError(err instanceof Error ? err.message : 'Error al cargar')
			setPlanifications([])
		} finally {
			setLoading(false)
		}
	}, [session?.user?.id, options?.date])

	useEffect(() => {
		if (sessionStatus === 'loading') {
			return
		}

		if (!enabled) {
			setPlanifications([])
			setLoading(false)
			return
		}

		if (session?.user?.id) {
			fetchPlanifications()
		} else {
			setPlanifications([])
			setLoading(false)
		}
	}, [session?.user?.id, sessionStatus, enabled, fetchPlanifications])

	return {
		planifications,
		loading,
		error,
		refetch: fetchPlanifications,
	}
}
