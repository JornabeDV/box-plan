'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { normalizeUserId } from '@/lib/auth-helpers'

export interface CoachInfo {
	id: number
	businessName: string | null
	phone: string | null
	email: string | null
}

interface UseStudentCoachReturn {
	coach: CoachInfo | null
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
}

export function useStudentCoach(): UseStudentCoachReturn {
	const { data: session } = useSession()
	const [coach, setCoach] = useState<CoachInfo | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const clearState = useCallback(() => {
		setCoach(null)
		setLoading(false)
		setError(null)
	}, [])

	const loadCoach = useCallback(async () => {
		const userId = normalizeUserId(session?.user?.id)
		
		if (!userId) {
			clearState()
			return
		}

		setLoading(true)
		setError(null)

		try {
			// Timestamp para evitar cache en Safari/iOS
			const timestamp = Date.now();
			const response = await fetch(`/api/student/coach?_t=${timestamp}`, {
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Pragma': 'no-cache',
				}
			})
			
			if (!response.ok) {
				if (response.status === 404) {
					setCoach(null)
					setLoading(false)
					return
				}
				throw new Error(`Error ${response.status} al obtener información del coach`)
			}

			const data = await response.json()
			
			if (data.data) {
				setCoach({
					id: data.data.id,
					businessName: data.data.businessName,
					phone: data.data.phone,
					email: data.data.email
				})
			} else {
				setCoach(null)
			}
		} catch (err: any) {
			console.error('Error fetching student coach:', err)
			setError(err instanceof Error ? err.message : 'Error desconocido')
			setCoach(null)
		} finally {
			setLoading(false)
		}
	}, [session?.user?.id, clearState])

	useEffect(() => {
		loadCoach()
	}, [loadCoach])

	const refetch = useCallback(async () => {
		await loadCoach()
	}, [loadCoach])

	return {
		coach,
		loading,
		error,
		refetch
	}
}
