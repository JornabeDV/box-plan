'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

export interface UserDiscipline {
	id: number
	userId: number
	disciplineId: number
	levelId: number | null
	preferredLevelId: number | null
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
	preferredLevel?: {
		id: number
		name: string
		description?: string | null
	}
}

const USER_DISCIPLINES_KEY = 'user-disciplines'

async function fetchUserDisciplines(userId: string | number): Promise<UserDiscipline[]> {
	const response = await fetch('/api/user-disciplines')

	if (!response.ok) {
		throw new Error('Error al cargar disciplinas')
	}

	return response.json()
}

export interface UserDisciplinesState {
	disciplines: UserDiscipline[]
	loading: boolean
	error: string | null
}

export function useUserDisciplines() {
	const { data: session, status: sessionStatus } = useSession()
	const queryClient = useQueryClient()
	const userId = session?.user?.id

	const { data: disciplines = [], isLoading, error, refetch } = useQuery({
		queryKey: [USER_DISCIPLINES_KEY, userId],
		queryFn: () => fetchUserDisciplines(userId!),
		enabled: sessionStatus !== 'loading' && !!userId,
	})

	const addDiscipline = useMutation({
		mutationFn: async ({ disciplineId, levelId }: { disciplineId: number; levelId?: number | null }) => {
			if (!userId) {
				throw new Error('Usuario no autenticado')
			}

			const response = await fetch('/api/user-disciplines', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					disciplineId,
					levelId: levelId ?? null,
				}),
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || 'Error al agregar disciplina')
			}

			return response.json()
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [USER_DISCIPLINES_KEY, userId] })
		},
	})

	const updateDisciplineLevel = useMutation({
		mutationFn: async ({ userDisciplineId, levelId }: { userDisciplineId: number; levelId: number | null }) => {
			if (!userId) {
				throw new Error('Usuario no autenticado')
			}

			const response = await fetch(`/api/user-disciplines/${userDisciplineId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ levelId }),
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || 'Error al actualizar nivel')
			}

			return response.json()
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [USER_DISCIPLINES_KEY, userId] })
		},
	})

	const removeDiscipline = useMutation({
		mutationFn: async (userDisciplineId: number) => {
			if (!userId) {
				throw new Error('Usuario no autenticado')
			}

			const response = await fetch(`/api/user-disciplines/${userDisciplineId}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || 'Error al eliminar disciplina')
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [USER_DISCIPLINES_KEY, userId] })
		},
	})

	const updatePreferredLevel = useMutation({
		mutationFn: async ({ userDisciplineId, preferredLevelId }: { userDisciplineId: number; preferredLevelId: number | null }) => {
			if (!userId) {
				throw new Error('Usuario no autenticado')
			}

			const response = await fetch(`/api/user-disciplines/${userDisciplineId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ preferredLevelId }),
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || 'Error al actualizar nivel favorito')
			}

			return response.json()
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [USER_DISCIPLINES_KEY, userId] })
		},
	})

	const hasDiscipline = (disciplineId: number) => {
		return disciplines.some(d => d.disciplineId === disciplineId)
	}

	const getDisciplineLevel = (disciplineId: number) => {
		const discipline = disciplines.find(d => d.disciplineId === disciplineId)
		return discipline?.levelId ?? null
	}

	const getDisciplinePreferredLevel = (disciplineId: number) => {
		const discipline = disciplines.find(d => d.disciplineId === disciplineId)
		return discipline?.preferredLevelId ?? null
	}

	return {
		disciplines,
		loading: isLoading,
		error: error ? (error instanceof Error ? error.message : 'Error al cargar disciplinas') : null,
		addDiscipline: addDiscipline.mutateAsync,
		updateDisciplineLevel: updateDisciplineLevel.mutateAsync,
		updatePreferredLevel: updatePreferredLevel.mutateAsync,
		removeDiscipline: removeDiscipline.mutateAsync,
		refetch,
		hasDiscipline,
		getDisciplineLevel,
		getDisciplinePreferredLevel,
	}
}
