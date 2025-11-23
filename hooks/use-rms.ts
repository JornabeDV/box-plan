'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface RMRecord {
	id: number
	userId: number
	exercise: string
	weight: number
	recordedAt: string
	createdAt: string
	updatedAt: string
}

interface RMRecordInsert {
	exercise: string
	weight: number
	recorded_at?: string
}

interface RMRecordUpdate {
	exercise?: string
	weight?: number
	recorded_at?: string
}

export function useRMs(userId?: string) {
	const { data: session } = useSession()
	const [rmRecords, setRmRecords] = useState<RMRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const actualUserId = userId || session?.user?.id

	// Cargar RMs del usuario
	const fetchRMs = async () => {
		if (!actualUserId) return

		try {
			setLoading(true)
			const response = await fetch(`/api/rms?userId=${actualUserId}`)
			
			if (!response.ok) {
				throw new Error('Error al cargar RMs')
			}

			const data = await response.json()
			setRmRecords(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar RMs')
		} finally {
			setLoading(false)
		}
	}

	// Registrar nuevo RM
	const logRM = async (rm: RMRecordInsert): Promise<RMRecord | null> => {
		if (!actualUserId) return null

		try {
			const response = await fetch('/api/rms', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(rm)
			})

			if (!response.ok) {
				throw new Error('Error al registrar RM')
			}

			const data = await response.json()
			
			// Actualizar la lista local
			setRmRecords(prev => [data, ...prev])
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al registrar RM')
			return null
		}
	}

	// Registrar múltiples RMs
	const logMultipleRMs = async (rms: RMRecordInsert[]): Promise<RMRecord[]> => {
		if (!actualUserId) return []

		try {
			const promises = rms.map(rm => logRM(rm))
			const results = await Promise.all(promises)
			return results.filter((rm): rm is RMRecord => rm !== null)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al registrar RMs')
			return []
		}
	}

	// Actualizar RM
	const updateRM = async (id: number, updates: RMRecordUpdate): Promise<RMRecord | null> => {
		try {
			const response = await fetch(`/api/rms/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updates)
			})

			if (!response.ok) {
				throw new Error('Error al actualizar RM')
			}

			const data = await response.json()
			
			// Actualizar la lista local
			setRmRecords(prev => prev.map(rm => rm.id === id ? data : rm))
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al actualizar RM')
			return null
		}
	}

	// Eliminar RM
	const deleteRM = async (id: number): Promise<boolean> => {
		try {
			const response = await fetch(`/api/rms/${id}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				throw new Error('Error al eliminar RM')
			}
			
			// Actualizar la lista local
			setRmRecords(prev => prev.filter(rm => rm.id !== id))
			return true
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al eliminar RM')
			return false
		}
	}

	// Obtener RMs por ejercicio
	const getRMsByExercise = useCallback((exercise: string): RMRecord[] => {
		return rmRecords.filter(rm => 
			rm.exercise.toLowerCase() === exercise.toLowerCase()
		).sort((a, b) => 
			new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
		)
	}, [rmRecords])

	// Obtener el RM más reciente de un ejercicio
	const getLatestRM = useCallback((exercise: string): RMRecord | null => {
		const exerciseRMs = getRMsByExercise(exercise)
		return exerciseRMs.length > 0 ? exerciseRMs[0] : null
	}, [getRMsByExercise])

	useEffect(() => {
		if (actualUserId) {
			fetchRMs()
		}
	}, [actualUserId]) // eslint-disable-line react-hooks/exhaustive-deps

	return {
		rmRecords,
		loading,
		error,
		fetchRMs,
		logRM,
		logMultipleRMs,
		updateRM,
		deleteRM,
		getRMsByExercise,
		getLatestRM,
	}
}