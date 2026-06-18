'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

const HOME_DATA_KEY = 'home-data'

interface HomeData {
	role: any
	adminProfile: any
	coachProfile: any
	profile: any
	subscription: any
	coach: any
	disciplines: any[]
	preferences: any
}

async function fetchHomeData(): Promise<HomeData> {
	const response = await fetch('/api/home')

	if (!response.ok) {
		throw new Error('Error al cargar los datos de la Home')
	}

	return response.json()
}

interface UseHomeDataReturn {
	data: HomeData | null
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
}

export function useHomeData(enabled: boolean = true): UseHomeDataReturn {
	const { data: session, status: sessionStatus } = useSession()
	const userId = session?.user?.id

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: [HOME_DATA_KEY, userId],
		queryFn: fetchHomeData,
		enabled: sessionStatus !== 'loading' && !!userId && enabled,
		staleTime: 1000 * 60,
	})

	return {
		data: data ?? null,
		loading: isLoading,
		error: error ? (error instanceof Error ? error.message : 'Error al cargar') : null,
		refetch: async () => {
			await refetch()
		},
	}
}
