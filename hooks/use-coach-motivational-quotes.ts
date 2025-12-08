'use client'

import { useState, useEffect } from 'react'

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
	const [quotes, setQuotes] = useState<string[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchQuotes = async () => {
		try {
			setLoading(true)
			setError(null)

			const response = await fetch('/api/students/coach-motivational-quotes')
			
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
		fetchQuotes()
	}, [])

	return {
		quotes,
		loading,
		error,
		refetch: fetchQuotes
	}
}
