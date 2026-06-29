'use client'

import { useQuery } from '@tanstack/react-query'
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

const TODAY_ALL_PLANIFICATIONS_KEY = 'today-all-planifications'

async function fetchTodayAllPlanifications(date?: string): Promise<Planification[]> {
	const query = date ? `?date=${date}` : ''
	const response = await fetch(`/api/planifications/today-all${query}`)

	if (!response.ok) {
		throw new Error('Error al cargar las planificaciones')
	}

	const data = await response.json()
	return data.data || []
}

export function useAllTodayPlanifications(
	options?: UseAllTodayPlanificationsOptions
): UseAllTodayPlanificationsReturn {
	const { data: session, status: sessionStatus } = useSession()
	const userId = session?.user?.id
	const enabled = options?.enabled !== false

	const { data: planifications = [], isLoading, error, refetch } = useQuery({
		queryKey: [TODAY_ALL_PLANIFICATIONS_KEY, userId, options?.date],
		queryFn: () => fetchTodayAllPlanifications(options?.date),
		enabled: sessionStatus !== 'loading' && !!userId && enabled,
		// La planificación de hoy puede cambiar, así que stale time corto
		staleTime: 1000 * 60,
	})

	return {
		planifications,
		loading: isLoading,
		error: error ? (error instanceof Error ? error.message : 'Error al cargar') : null,
		refetch: async () => {
			await refetch()
		},
	}
}
