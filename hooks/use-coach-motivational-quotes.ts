'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UseCoachMotivationalQuotesReturn {
	quotes: string[]
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
}

/**
 * Hook para obtener las frases motivacionales del coach del estudiante
 * Si el estudiante no tiene coach o el coach no tiene frases, devuelve array vacío
 */
export function useCoachMotivationalQuotes(): UseCoachMotivationalQuotesReturn {
	const { data: session, status: sessionStatus } = useSession()
	const [quotes, setQuotes] = useState<string[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchQuotes = async () => {
		// No cargar si no hay sesión
		if (!session?.user?.id) {
			setLoading(false)
			setQuotes([])
			return
		}

		try {
			setLoading(true)
			setError(null)

			// Timestamp para evitar cache en Safari/iOS
			const timestamp = Date.now()
			const response = await fetch(`/api/students/coach-motivational-quotes?_t=${timestamp}`, {
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Pragma': 'no-cache',
				}
			})
			
			// Si es 401, no es un error real - simplemente no hay sesión
			if (response.status === 401) {
				setQuotes([])
				setLoading(false)
				return
			}
			
			if (!response.ok) {
				throw new Error('Error al obtener frases motivacionales')
			}

			const data = await response.json()
			setQuotes(data.quotes || [])
		} catch (err) {
			console.error('Error fetching coach motivational quotes:', err)
			setError(err instanceof Error ? err.message : 'Error desconocido')
			setQuotes([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (session !== undefined) {
			fetchQuotes()
		}
	}, [session?.user?.id])

	return {
		quotes,
		loading,
		error,
		refetch: fetchQuotes
	}
}
