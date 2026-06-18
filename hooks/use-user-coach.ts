'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

export interface Coach {
	id: number
	userId: number
	name: string
	email: string
	image: string | null
	businessName: string | null
	phone: string | null
	address: string | null
	logoUrl: string | null
	joinedAt: string | Date
}

interface UserCoachResponse {
	success: boolean
	coach: Coach | null
}

const USER_COACH_KEY = 'user-coach'

async function fetchUserCoach(): Promise<Coach | null> {
	const response = await fetch('/api/user-coach')

	if (response.status === 401) {
		return null
	}

	if (!response.ok) {
		throw new Error('Error al cargar el coach')
	}

	const data: UserCoachResponse = await response.json()
	return data.success ? data.coach : null
}

interface UseUserCoachReturn {
	coach: Coach | null
	loading: boolean
	error: string | null
	loadCoach: () => Promise<void>
}

export function useUserCoach(): UseUserCoachReturn {
	const { data: session, status: sessionStatus } = useSession()

	const { data: coach, isLoading, error, refetch } = useQuery({
		queryKey: [USER_COACH_KEY, session?.user?.id],
		queryFn: fetchUserCoach,
		enabled: sessionStatus !== 'loading' && !!session?.user?.id,
		staleTime: 1000 * 60 * 5,
	})

	return {
		coach: coach ?? null,
		loading: isLoading,
		error: error ? (error instanceof Error ? error.message : 'Error al cargar el coach') : null,
		loadCoach: async () => {
			await refetch()
		},
	}
}
