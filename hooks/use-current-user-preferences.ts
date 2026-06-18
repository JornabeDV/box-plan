'use client'

import { useState, useEffect } from 'react'
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

export function useCurrentUserPreferences() {
	const { data: session, status: sessionStatus } = useSession()
	const [state, setState] = useState<CurrentUserPreferencesState>({
		preferences: null,
		loading: true,
		error: null,
		lockStatus: null
	})

	const fetchPreferences = async (opts?: { forceRefresh?: boolean }) => {
		if (!session?.user?.id) {
			setState(prev => ({ ...prev, loading: false, preferences: null }))
			return
		}

		try {
			setState(prev => ({ ...prev, loading: true, error: null }))

			// Timestamp para evitar cache en Safari/iOS
			const response = await fetch(`/api/user-preferences/${session.user.id}`, {
				cache: opts?.forceRefresh ? 'no-store' : 'default'
			})

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

				// El lock status viene calculado desde el backend
				const lockStatus = data.lock_status || null

				setState(prev => ({ ...prev, loading: false, preferences, lockStatus }))
			} else {
				setState(prev => ({ ...prev, loading: false, preferences: null, lockStatus: null }))
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
				const errorData = await response.json().catch(() => ({}))
				// Si es un error de bloqueo (403), retornar el mensaje específico
				if (response.status === 403 && errorData.message) {
					return { error: errorData.message, nextChangeDate: errorData.nextChangeDate || null }
				}
				throw new Error(errorData.error || errorData.message || 'Error al actualizar preferencias')
			}

			const data = await response.json()

			// Recargar preferencias
			await fetchPreferences({ forceRefresh: true })

			return { data, error: null }
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al actualizar preferencias'
			setState(prev => ({ ...prev, loading: false, error: errorMessage }))
			return { error: errorMessage }
		}
	}

	useEffect(() => {
		// Si la sesión aún está cargando, esperar
		if (sessionStatus === 'loading') {
			return
		}
		
		if (session?.user?.id) {
			fetchPreferences()
		} else {
			// Si la sesión está cargada pero no hay usuario, detener loading
			setState(prev => ({ ...prev, loading: false }))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user?.id, sessionStatus])

	return {
		...state,
		updatePreferences,
		refetch: fetchPreferences
	}
}