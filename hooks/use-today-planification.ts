'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface Planification {
	id: string
	title: string
	description?: string
	date: string
	disciplineId: number
	disciplineLevelId: number
	coachId: number
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

interface UseTodayPlanificationReturn {
	planifications: {
		primary: Planification | null
		others: Planification[]
	}
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
}

interface UseTodayPlanificationOptions {
	enabled?: boolean
}

/**
 * Hook para obtener la planificación de hoy
 */
export function useTodayPlanification(options?: UseTodayPlanificationOptions): UseTodayPlanificationReturn {
	const { data: session, status: sessionStatus } = useSession()
	const [planifications, setPlanifications] = useState<{ primary: Planification | null; others: Planification[] }>({
		primary: null,
		others: []
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const fetchingRef = useRef(false)
	const enabled = options?.enabled !== false

	const fetchTodayPlanification = useCallback(async () => {
		if (fetchingRef.current) {
			return
		}

		const userId = session?.user?.id
		if (!userId) {
			setPlanifications({ primary: null, others: [] })
			setLoading(false)
			return
		}

		try {
			fetchingRef.current = true
			setLoading(true)
			setError(null)

			// Formatear la fecha de hoy como YYYY-MM-DD
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			const year = today.getFullYear()
			const month = String(today.getMonth() + 1).padStart(2, '0')
			const day = String(today.getDate()).padStart(2, '0')
			const dateString = `${year}-${month}-${day}`

			// Timestamp para evitar cache en Safari/iOS
			const timestamp = Date.now();
			const response = await fetch(`/api/planifications?date=${dateString}&_t=${timestamp}`, {
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Pragma': 'no-cache',
				}
			})
			
			if (!response.ok) {
				throw new Error('Error al cargar la planificación')
			}

			const data = await response.json()
			
			if (data.data || (data.others && data.others.length > 0)) {
				setPlanifications({
					primary: data.data || null,
					others: data.others || []
				})
			} else {
				setPlanifications({ primary: null, others: [] })
			}
		} catch (err) {
			console.error('Error fetching today planification:', err)
			setError(err instanceof Error ? err.message : 'Error al cargar la planificación')
			setPlanifications({ primary: null, others: [] })
		} finally {
			setLoading(false)
			fetchingRef.current = false
		}
	}, [session?.user?.id])

	useEffect(() => {
		// Si la sesión aún está cargando, esperar
		if (sessionStatus === 'loading') {
			return
		}
		
		if (!enabled) {
			setPlanifications({ primary: null, others: [] })
			setLoading(false)
			return
		}
		
		if (session?.user?.id) {
			fetchTodayPlanification()
		} else {
			setPlanifications({ primary: null, others: [] })
			setLoading(false)
		}
	}, [session?.user?.id, sessionStatus, fetchTodayPlanification, enabled])

	return {
		planifications,
		loading,
		error,
		refetch: fetchTodayPlanification
	}
}
