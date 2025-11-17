'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface CurrentUserPreference {
	id: number
	userId: number
	preferredDisciplineId: number | null
	preferredLevelId: number | null
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

export interface CurrentUserPreferencesState {
	preferences: CurrentUserPreference | null
	loading: boolean
	error: string | null
}

export function useCurrentUserPreferences() {
	const { data: session } = useSession()
	const [state, setState] = useState<CurrentUserPreferencesState>({
		preferences: null,
		loading: true,
		error: null
	})

	const fetchPreferences = async () => {
		if (!session?.user?.id) {
			setState(prev => ({ ...prev, loading: false, preferences: null }))
			return
		}

		try {
			setState(prev => ({ ...prev, loading: true, error: null }))

			const response = await fetch(`/api/user-preferences/${session.user.id}`)

			if (!response.ok) {
				if (response.status === 404) {
					// No hay preferencias, no es un error
					setState(prev => ({ ...prev, loading: false, preferences: null }))
					return
				}
				throw new Error('Error al cargar preferencias')
			}

			const data = await response.json()

			if (data) {
				// Transformar la respuesta a nuestro formato
				const preferences: CurrentUserPreference = {
					id: data.id,
					userId: data.userId || data.user_id,
					preferredDisciplineId: data.preferredDisciplineId || data.preferred_discipline_id || data.discipline_id,
					preferredLevelId: data.preferredLevelId || data.preferred_level_id || data.level_id,
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

				setState(prev => ({ ...prev, loading: false, preferences }))
			} else {
				setState(prev => ({ ...prev, loading: false, preferences: null }))
			}
		} catch (error) {
			console.error('Error fetching user preferences:', error)
			setState(prev => ({
				...prev,
				loading: false,
				error: error instanceof Error ? error.message : 'Error al cargar preferencias'
			}))
		}
	}

	const updatePreferences = async (disciplineId: number | null, levelId: number | null) => {
		if (!session?.user?.id) {
			return { error: 'Usuario no autenticado' }
		}

		try {
			setState(prev => ({ ...prev, loading: true, error: null }))

			const response = await fetch(`/api/user-preferences/${session.user.id}`, {
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
				throw new Error('Error al actualizar preferencias')
			}

			const data = await response.json()

			// Recargar preferencias
			await fetchPreferences()

			return { data, error: null }
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al actualizar preferencias'
			setState(prev => ({ ...prev, loading: false, error: errorMessage }))
			return { error: errorMessage }
		}
	}

	useEffect(() => {
		if (session?.user?.id) {
			fetchPreferences()
		} else if (session !== undefined) {
			setState(prev => ({ ...prev, loading: false }))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user?.id])

	return {
		...state,
		updatePreferences,
		refetch: fetchPreferences
	}
}