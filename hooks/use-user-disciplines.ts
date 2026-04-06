'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface UserDiscipline {
	id: number
	userId: number
	disciplineId: number
	levelId: number | null
	createdAt: string
	updatedAt: string
	discipline?: {
		id: number
		name: string
		color: string
		description?: string
	}
	level?: {
		id: number
		name: string
		description?: string | null
	}
}

export interface UserDisciplinesState {
	disciplines: UserDiscipline[]
	loading: boolean
	error: string | null
}

export function useUserDisciplines() {
	const { data: session, status: sessionStatus } = useSession()
	const [state, setState] = useState<UserDisciplinesState>({
		disciplines: [],
		loading: true,
		error: null
	})

	const fetchDisciplines = useCallback(async () => {
		if (!session?.user?.id) {
			setState(prev => ({ ...prev, loading: false, disciplines: [] }))
			return
		}

		try {
			setState(prev => ({ ...prev, loading: true, error: null }))

			const timestamp = Date.now()
			const response = await fetch(`/api/user-disciplines?_t=${timestamp}`, {
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Pragma': 'no-cache',
				}
			})

			if (!response.ok) {
				throw new Error('Error al cargar disciplinas')
			}

			const data = await response.json()
			setState(prev => ({ ...prev, loading: false, disciplines: data }))
		} catch (error) {
			console.error('Error fetching user disciplines:', error)
			setState(prev => ({
				...prev,
				loading: false,
				error: error instanceof Error ? error.message : 'Error al cargar disciplinas'
			}))
		}
	}, [session?.user?.id])

	const addDiscipline = async (disciplineId: number, levelId?: number | null) => {
		if (!session?.user?.id) {
			return { error: 'Usuario no autenticado' }
		}

		try {
			setState(prev => ({ ...prev, loading: true, error: null }))

			const response = await fetch('/api/user-disciplines', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					disciplineId,
					levelId: levelId ?? null
				})
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				return { 
					error: errorData.error || 'Error al agregar disciplina',
					status: response.status 
				}
			}

			const data = await response.json()
			await fetchDisciplines()
			return { data, error: null }
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al agregar disciplina'
			setState(prev => ({ ...prev, loading: false, error: errorMessage }))
			return { error: errorMessage }
		}
	}

	const updateDisciplineLevel = async (userDisciplineId: number, levelId: number | null) => {
		if (!session?.user?.id) {
			return { error: 'Usuario no autenticado' }
		}

		try {
			setState(prev => ({ ...prev, loading: true, error: null }))

			const response = await fetch(`/api/user-disciplines/${userDisciplineId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ levelId })
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				return { error: errorData.error || 'Error al actualizar nivel' }
			}

			const data = await response.json()
			await fetchDisciplines()
			return { data, error: null }
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al actualizar nivel'
			setState(prev => ({ ...prev, loading: false, error: errorMessage }))
			return { error: errorMessage }
		}
	}

	const removeDiscipline = async (userDisciplineId: number) => {
		if (!session?.user?.id) {
			return { error: 'Usuario no autenticado' }
		}

		try {
			setState(prev => ({ ...prev, loading: true, error: null }))

			const response = await fetch(`/api/user-disciplines/${userDisciplineId}`, {
				method: 'DELETE'
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				return { error: errorData.error || 'Error al eliminar disciplina' }
			}

			await fetchDisciplines()
			return { success: true, error: null }
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al eliminar disciplina'
			setState(prev => ({ ...prev, loading: false, error: errorMessage }))
			return { error: errorMessage }
		}
	}

	const hasDiscipline = useCallback((disciplineId: number) => {
		return state.disciplines.some(d => d.disciplineId === disciplineId)
	}, [state.disciplines])

	const getDisciplineLevel = useCallback((disciplineId: number) => {
		const discipline = state.disciplines.find(d => d.disciplineId === disciplineId)
		return discipline?.levelId ?? null
	}, [state.disciplines])

	useEffect(() => {
		if (sessionStatus === 'loading') {
			return
		}

		if (session?.user?.id) {
			fetchDisciplines()
		} else {
			setState(prev => ({ ...prev, loading: false }))
		}
	}, [session?.user?.id, sessionStatus, fetchDisciplines])

	return {
		...state,
		addDiscipline,
		updateDisciplineLevel,
		removeDiscipline,
		refetch: fetchDisciplines,
		hasDiscipline,
		getDisciplineLevel
	}
}
