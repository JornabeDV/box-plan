'use client'

import { useQuery } from '@tanstack/react-query'
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

const TODAY_PLANIFICATION_KEY = 'today-planification'

function getTodayString(): string {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const year = today.getFullYear()
	const month = String(today.getMonth() + 1).padStart(2, '0')
	const day = String(today.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

async function fetchTodayPlanification(): Promise<{ primary: Planification | null; others: Planification[] }> {
	const dateString = getTodayString()
	const response = await fetch(`/api/planifications?date=${dateString}`)

	if (!response.ok) {
		throw new Error('Error al cargar la planificación')
	}

	const data = await response.json()

	return {
		primary: data.data || null,
		others: data.others || [],
	}
}

/**
 * Hook para obtener la planificación de hoy
 */
export function useTodayPlanification(options?: UseTodayPlanificationOptions): UseTodayPlanificationReturn {
	const { data: session, status: sessionStatus } = useSession()
	const userId = session?.user?.id
	const enabled = options?.enabled !== false

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: [TODAY_PLANIFICATION_KEY, userId],
		queryFn: fetchTodayPlanification,
		enabled: sessionStatus !== 'loading' && !!userId && enabled,
		// La planificación de hoy puede cambiar, así que stale time corto
		staleTime: 1000 * 60,
	})

	return {
		planifications: data || { primary: null, others: [] },
		loading: isLoading,
		error: error ? (error instanceof Error ? error.message : 'Error al cargar la planificación') : null,
		refetch: async () => {
			await refetch()
		},
	}
}
