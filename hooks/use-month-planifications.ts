'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface MonthPlanificationsState {
	datesWithPlanification: number[]
	personalizedDays: number[]
	firstAvailableDay: number | null
	loading: boolean
	error: string | null
	year: number | null
	month: number | null
	disciplineId: number | null
}

const createInitialState = (overrides?: Partial<MonthPlanificationsState>): MonthPlanificationsState => ({
	datesWithPlanification: [],
	personalizedDays: [],
	firstAvailableDay: null,
	loading: true,
	error: null,
	year: null,
	month: null,
	disciplineId: null,
	...overrides
})

export function useMonthPlanifications(year: number, month: number, disciplineId?: number | null) {
	const [state, setState] = useState<MonthPlanificationsState>(() => createInitialState())
	const lastRequestRef = useRef({ year, month, disciplineId: disciplineId ?? null })

	const { data: session } = useSession()

	// Resetear el estado sincrónicamente cuando cambian año/mes/disciplina.
	// Esto evita que durante un render intermedio se pinten los días del mes
	// anterior con la cuadrícula del mes nuevo.
	const currentRequest = { year, month, disciplineId: disciplineId ?? null }
	if (
		lastRequestRef.current.year !== currentRequest.year ||
		lastRequestRef.current.month !== currentRequest.month ||
		lastRequestRef.current.disciplineId !== currentRequest.disciplineId
	) {
		lastRequestRef.current = currentRequest
		setState(createInitialState())
	}

	useEffect(() => {
		let isStale = false

		const fetchMonthPlanifications = async () => {
			if (!session?.user?.id) {
				setState(prev => createInitialState({ loading: false }))
				return
			}

			try {
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

				// Ignorar respuestas de peticiones obsoletas si el usuario cambió de mes/disciplina
				if (isStale) return

				if (data.data && Array.isArray(data.data)) {
					const dates = data.data.sort((a: number, b: number) => a - b)
					const personalized = Array.isArray(data.personalizedDays)
						? data.personalizedDays.sort((a: number, b: number) => a - b)
						: []
					const firstDay = dates.length > 0 ? dates[0] : null

					setState(prev => ({
						...prev,
						datesWithPlanification: dates,
						personalizedDays: personalized,
						firstAvailableDay: firstDay,
						loading: false,
						year,
						month,
						disciplineId: disciplineId ?? null
					}))
				} else {
					setState(prev => ({
						...prev,
						datesWithPlanification: [],
						personalizedDays: [],
						firstAvailableDay: null,
						loading: false,
						year,
						month,
						disciplineId: disciplineId ?? null
					}))
				}
			} catch (error) {
				if (isStale) return
				console.error('Error fetching month planifications:', error)
				setState(prev => ({
					...prev,
					loading: false,
					error: error instanceof Error ? error.message : 'Error al cargar las planificaciones',
					year,
					month,
					disciplineId: disciplineId ?? null
				}))
			}
		}

		fetchMonthPlanifications()

		return () => {
			isStale = true
		}
	}, [session?.user?.id, year, month, disciplineId])

	return state
}
