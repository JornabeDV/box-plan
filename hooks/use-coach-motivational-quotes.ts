'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

interface UseCoachMotivationalQuotesReturn {
	quotes: string[]
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
}

const COACH_QUOTES_KEY = 'coach-motivational-quotes'

async function fetchCoachMotivationalQuotes(): Promise<string[]> {
	const response = await fetch('/api/students/coach-motivational-quotes')

	if (response.status === 401) {
		return []
	}

	if (!response.ok) {
		throw new Error('Error al obtener frases motivacionales')
	}

	const data = await response.json()
	return data.quotes || []
}

/**
 * Hook para obtener las frases motivacionales del coach del estudiante
 * Si el estudiante no tiene coach o el coach no tiene frases, devuelve array vacío
 */
export function useCoachMotivationalQuotes(): UseCoachMotivationalQuotesReturn {
	const { data: session, status: sessionStatus } = useSession()

	const { data: quotes = [], isLoading, error, refetch } = useQuery({
		queryKey: [COACH_QUOTES_KEY, session?.user?.id],
		queryFn: fetchCoachMotivationalQuotes,
		enabled: sessionStatus !== 'loading' && !!session?.user?.id,
		staleTime: 1000 * 60 * 10,
	})

	return {
		quotes,
		loading: isLoading,
		error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
		refetch: async () => {
			await refetch()
		},
	}
}
