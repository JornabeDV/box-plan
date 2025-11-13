'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface MonthPlanificationsState {
	datesWithPlanification: number[]
	firstAvailableDay: number | null
	loading: boolean
	error: string | null
}

export function useMonthPlanifications(year: number, month: number, disciplineId?: number | null) {
	const [state, setState] = useState<MonthPlanificationsState>({
		datesWithPlanification: [],
		firstAvailableDay: null,
		loading: true,
		error: null
	})

	const { data: session } = useSession()

	useEffect(() => {
		const fetchMonthPlanifications = async () => {
			if (!session?.user?.id) {
				setState(prev => ({
					...prev,
					loading: false,
					datesWithPlanification: [],
					firstAvailableDay: null
				}))
				return
			}

			try {
				setState(prev => ({ ...prev, loading: true, error: null }))

				// Construir URL con parámetros opcionales
				const params = new URLSearchParams({
					year: year.toString(),
					month: month.toString()
				})
				
				if (disciplineId !== null && disciplineId !== undefined) {
					params.append('disciplineId', disciplineId.toString())
				}

				const response = await fetch(
					`/api/planifications/month?${params.toString()}`
				)

				if (!response.ok) {
					throw new Error('Error al cargar las planificaciones del mes')
				}

				const data = await response.json()

				if (data.data && Array.isArray(data.data)) {
					const dates = data.data.sort((a: number, b: number) => a - b)
					const firstDay = dates.length > 0 ? dates[0] : null

					setState(prev => ({
						...prev,
						datesWithPlanification: dates,
						firstAvailableDay: firstDay,
						loading: false
					}))
				} else {
					setState(prev => ({
						...prev,
						datesWithPlanification: [],
						firstAvailableDay: null,
						loading: false
					}))
				}
			} catch (error) {
				console.error('Error fetching month planifications:', error)
				setState(prev => ({
					...prev,
					loading: false,
					error: error instanceof Error ? error.message : 'Error al cargar las planificaciones'
				}))
			}
		}

		fetchMonthPlanifications()
	}, [session?.user?.id, year, month, disciplineId])

	return state
}