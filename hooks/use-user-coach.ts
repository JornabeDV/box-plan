'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Coach {
	id: number
	userId: number
	name: string
	email: string
	image: string | null
	businessName: string | null
	phone: string | null
	address: string | null
	joinedAt: string | Date
}

interface UserCoachState {
	coach: Coach | null
	loading: boolean
	error: string | null
}

export function useUserCoach() {
	const [state, setState] = useState<UserCoachState>({
		coach: null,
		loading: true,
		error: null
	})

	const { data: session } = useSession()

	const loadCoach = async () => {
		try {
			setState(prev => ({ ...prev, loading: true, error: null }))

			const userId = session?.user?.id
			if (!userId) {
				setState(prev => ({ ...prev, loading: false, coach: null }))
				return
			}

			const response = await fetch('/api/user-coach')
			
			if (!response.ok) {
				if (response.status === 401) {
					setState(prev => ({ ...prev, loading: false, coach: null }))
					return
				}
				throw new Error('Error al cargar el coach')
			}

			const data = await response.json()

			if (data.success) {
				setState(prev => ({
					...prev,
					coach: data.coach,
					loading: false
				}))
			} else {
				setState(prev => ({
					...prev,
					coach: null,
					loading: false
				}))
			}
		} catch (error) {
			console.error('Error loading coach:', error)
			setState(prev => ({
				...prev,
				loading: false,
				error: error instanceof Error ? error.message : 'Error al cargar el coach'
			}))
		}
	}

	useEffect(() => {
		if (session?.user?.id) {
			loadCoach()
		} else if (session !== undefined) {
			setState(prev => ({ ...prev, loading: false }))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user?.id])

	return {
		...state,
		loadCoach
	}
}