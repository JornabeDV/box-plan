'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

export interface CurrentUserPreference {
	id: number
	userId: number
	preferredDisciplineId: number | null
	preferredLevelId: number | null
	lastPreferenceChangeDate: string | null
	createdAt: string
	updatedAt: string
	discipline?: {
		id: number
		name: string
		color: string
	}
	level?: {
		id: number
		name: string
		description: string | null
	}
}

export interface PreferenceLockStatus {
	isLocked: boolean
	nextChangeDate: string | null
	message: string | null
}

export interface CurrentUserPreferencesState {
	preferences: CurrentUserPreference | null
	loading: boolean
	error: string | null
	lockStatus: PreferenceLockStatus | null
}

const USER_PREFERENCES_KEY = 'user-preferences'

async function fetchUserPreferences(userId: string | number): Promise<CurrentUserPreferencesState> {
	const response = await fetch(`/api/user-preferences/${userId}`)

	if (response.status === 404) {
		return { preferences: null, loading: false, error: null, lockStatus: null }
	}

	if (!response.ok) {
		throw new Error('Error al cargar preferencias')
	}

	const data = await response.json()

	if (!data) {
		return { preferences: null, loading: false, error: null, lockStatus: null }
	}

	const preferences: CurrentUserPreference = {
		id: data.id,
		userId: data.userId || data.user_id,
		preferredDisciplineId: data.preferredDisciplineId || data.preferred_discipline_id || data.discipline_id,
		preferredLevelId: data.preferredLevelId || data.preferred_level_id || data.level_id,
		lastPreferenceChangeDate: data.lastPreferenceChangeDate || data.last_preference_change_date || null,
		createdAt: data.createdAt || data.created_at,
		updatedAt: data.updatedAt || data.updated_at,
		discipline: data.discipline_id ? {
			id: data.discipline_id,
			name: data.discipline_name || data.discipline?.name,
			color: data.discipline_color || data.discipline?.color
		} : undefined,
		level: data.level_id ? {
			id: data.level_id,
			name: data.level_name || data.level?.name,
			description: data.level_description || data.level?.description
		} : undefined
	}

	return {
		preferences,
		loading: false,
		error: null,
		lockStatus: data.lock_status || null,
	}
}

export function useCurrentUserPreferences() {
	const { data: session, status: sessionStatus } = useSession()
	const queryClient = useQueryClient()
	const userId = session?.user?.id

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: [USER_PREFERENCES_KEY, userId],
		queryFn: () => fetchUserPreferences(userId!),
		enabled: sessionStatus !== 'loading' && !!userId,
		staleTime: 1000 * 60 * 5,
	})

	const updatePreferences = useMutation({
		mutationFn: async ({ disciplineId, levelId }: { disciplineId: number | null; levelId: number | null }) => {
			if (!userId) {
				throw new Error('Usuario no autenticado')
			}

			const response = await fetch(`/api/user-preferences/${userId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					preferred_discipline_id: disciplineId,
					preferred_level_id: levelId
				})
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				if (response.status === 403 && errorData.message) {
					throw new Error(errorData.message)
				}
				throw new Error(errorData.error || errorData.message || 'Error al actualizar preferencias')
			}

			return response.json()
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [USER_PREFERENCES_KEY, userId] })
		},
	})

	return {
		preferences: data?.preferences ?? null,
		loading: isLoading,
		error: error ? (error instanceof Error ? error.message : 'Error al cargar preferencias') : null,
		lockStatus: data?.lockStatus ?? null,
		updatePreferences: updatePreferences.mutateAsync,
		refetch: async () => {
			await refetch()
		},
	}
}
