'use client'

import { useState, useEffect, useCallback } from 'react'

export interface CoachUserDiscipline {
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
	}
	level?: {
		id: number
		name: string
	}
}

export interface CoachUserDisciplinesState {
	disciplines: CoachUserDiscipline[]
	loading: boolean
	error: string | null
}

export function useCoachUserDisciplines(studentId: string | null) {
	const [state, setState] = useState<CoachUserDisciplinesState>({
		disciplines: [],
		loading: false,
		error: null
	})

	const fetchDisciplines = useCallback(async () => {
		if (!studentId) {
			setState(prev => ({ ...prev, loading: false, disciplines: [] }))
			return
		}

		try {
			setState(prev => ({ ...prev, loading: true, error: null }))

			const timestamp = Date.now()
			const response = await fetch(`/api/coach/user-disciplines/${studentId}?_t=${timestamp}`, {
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Pragma': 'no-cache',
				}
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || 'Error al cargar disciplinas')
			}

			const data = await response.json()
			setState(prev => ({ ...prev, loading: false, disciplines: data }))
		} catch (error) {
			console.error('Error fetching student disciplines:', error)
			setState(prev => ({
				...prev,
				loading: false,
				error: error instanceof Error ? error.message : 'Error al cargar disciplinas'
			}))
		}
	}, [studentId])

	const addDiscipline = async (disciplineId: number, levelId?: number | null) => {
		if (!studentId) {
			return { error: 'No hay estudiante seleccionado' }
		}

		try {
			const response = await fetch(`/api/coach/user-disciplines/${studentId}`, {
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
			return { error: errorMessage }
		}
	}

	const removeDiscipline = async (userDisciplineId: number) => {
		if (!studentId) {
			return { error: 'No hay estudiante seleccionado' }
		}

		try {
			const response = await fetch(`/api/coach/user-disciplines/${studentId}?userDisciplineId=${userDisciplineId}`, {
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
			return { error: errorMessage }
		}
	}

	const hasDiscipline = useCallback((disciplineId: number) => {
		return state.disciplines.some(d => d.disciplineId === disciplineId)
	}, [state.disciplines])

	useEffect(() => {
		if (studentId) {
			fetchDisciplines()
		} else {
			setState(prev => ({ ...prev, loading: false, disciplines: [] }))
		}
	}, [studentId, fetchDisciplines])

	return {
		...state,
		addDiscipline,
		removeDiscipline,
		refetch: fetchDisciplines,
		hasDiscipline
	}
}
