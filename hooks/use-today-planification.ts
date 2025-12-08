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
	discipline?: {
		id: string
		name: string
		color?: string
	}
	disciplineLevel?: {
		id: string
		name: string
		description?: string
	}
}

interface UseTodayPlanificationReturn {
	planification: Planification | null
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
	const { data: session } = useSession()
	const [planification, setPlanification] = useState<Planification | null>(null)
	const [loading, setLoading] = useState(false) // Cambiar a false para evitar flash
	const [error, setError] = useState<string | null>(null)
	const fetchingRef = useRef(false)
	const enabled = options?.enabled !== false

	const fetchTodayPlanification = useCallback(async () => {
		if (fetchingRef.current) {
			return
		}

		const userId = session?.user?.id
		if (!userId) {
			setPlanification(null)
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

			const response = await fetch(`/api/planifications?date=${dateString}`)
			
			if (!response.ok) {
				throw new Error('Error al cargar la planificación')
			}

			const data = await response.json()
			
			if (data.data) {
				setPlanification(data.data)
			} else {
				setPlanification(null)
			}
		} catch (err) {
			console.error('Error fetching today planification:', err)
			setError(err instanceof Error ? err.message : 'Error al cargar la planificación')
			setPlanification(null)
		} finally {
			setLoading(false)
			fetchingRef.current = false
		}
	}, [session?.user?.id])

	useEffect(() => {
		if (!enabled) {
			setPlanification(null)
			setLoading(false)
			return
		}
		
		if (session?.user?.id) {
			fetchTodayPlanification()
		} else {
			setPlanification(null)
			setLoading(false)
		}
	}, [session?.user?.id, fetchTodayPlanification, enabled])

	return {
		planification,
		loading,
		error,
		refetch: fetchTodayPlanification
	}
}
