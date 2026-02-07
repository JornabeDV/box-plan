'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Planification, WorkoutScore } from '@/components/planification/types'

interface UsePlanificationDataProps {
	userId?: string | number
}

interface DisciplineLevel {
	id: number
	name: string
	description: string | null
}

export function usePlanificationData({ userId }: UsePlanificationDataProps) {
	const searchParams = useSearchParams()
	const [planification, setPlanification] = useState<Planification | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [existingWodWorkout, setExistingWodWorkout] = useState<WorkoutScore | null>(null)
	const [existingStrengthWorkout, setExistingStrengthWorkout] = useState<WorkoutScore | null>(null)
	
	// Estados para nivel
	const [disciplineId, setDisciplineId] = useState<number | null>(null)
	const [disciplineName, setDisciplineName] = useState('')
	const [levels, setLevels] = useState<DisciplineLevel[]>([])
	const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)

	// Usar ref para evitar re-renders innecesarios
	const isLoadingRef = useRef(false)

	// Función para cargar info de disciplina
	const fetchDisciplineInfo = useCallback(async (id: number) => {
		try {
			const response = await fetch(`/api/disciplines/${id}`)
			if (response.ok) {
				const data = await response.json()
				setDisciplineName(data.name || '')
				if (data.levels && Array.isArray(data.levels)) {
					setLevels(data.levels.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)))
				} else {
					setLevels([])
				}
			}
		} catch (error) {
			console.error('Error fetching discipline:', error)
		}
	}, [])

	// Función para cargar workouts existentes
	const fetchExistingWorkouts = useCallback(async (planificationId: string) => {
		if (!userId || !planificationId) {
			setExistingWodWorkout(null)
			setExistingStrengthWorkout(null)
			return
		}

		try {
			const userIdStr = String(userId)
			const response = await fetch(`/api/workouts?userId=${userIdStr}`)
			if (response.ok) {
				const workouts = await response.json()
				const planificationIdNum = parseInt(planificationId, 10)

				const wodWorkout = workouts.find((w: any) => {
					const wPlanificationId = w.planificationId !== null && w.planificationId !== undefined
						? Number(w.planificationId)
						: (w.planification_id !== null && w.planification_id !== undefined
							? Number(w.planification_id)
							: null)
					return wPlanificationId === planificationIdNum && w.data?.type === 'wod_score'
				})

				const strengthWorkout = workouts.find((w: any) => {
					const wPlanificationId = w.planificationId !== null && w.planificationId !== undefined
						? Number(w.planificationId)
						: (w.planification_id !== null && w.planification_id !== undefined
							? Number(w.planification_id)
							: null)
					return wPlanificationId === planificationIdNum && w.data?.type === 'strength_score'
				})

				if (wodWorkout) {
					setExistingWodWorkout({
						id: String(wodWorkout.id),
						duration_seconds: wodWorkout.durationSeconds || wodWorkout.duration_seconds,
						completed_at: wodWorkout.completedAt || wodWorkout.completed_at
					})
				} else {
					setExistingWodWorkout(null)
				}

				if (strengthWorkout) {
					setExistingStrengthWorkout({
						id: String(strengthWorkout.id),
						duration_seconds: null,
						completed_at: strengthWorkout.completedAt || strengthWorkout.completed_at,
						weight: strengthWorkout.data?.weight || null
					})
				} else {
					setExistingStrengthWorkout(null)
				}
			}
		} catch (error) {
			console.error('Error fetching existing workouts:', error)
			setExistingWodWorkout(null)
			setExistingStrengthWorkout(null)
		}
	}, [userId])

	// Efecto principal: carga preferencias y planificación
	useEffect(() => {
		// Evitar ejecuciones múltiples
		if (isLoadingRef.current) return
		if (!userId) {
			setLoading(false)
			return
		}

		isLoadingRef.current = true
		setLoading(true)
		setError(null)

		const loadData = async () => {
			try {
				// Paso 1: Cargar preferencias del usuario
				const prefsResponse = await fetch(`/api/user-preferences/${userId}`)
				let initialLevelId: number | null = null
				let initialDisciplineId: number | null = null

				if (prefsResponse.ok) {
					const prefs = await prefsResponse.json()
					if (prefs?.preferred_level_id) {
						initialLevelId = parseInt(prefs.preferred_level_id)
						setSelectedLevelId(initialLevelId)
					}
					if (prefs?.preferred_discipline_id) {
						initialDisciplineId = parseInt(prefs.preferred_discipline_id)
						setDisciplineId(initialDisciplineId)
					}
				}

				// Usar el levelId de las preferencias o el seleccionado manualmente
				const levelToUse = selectedLevelId ?? initialLevelId

				// Paso 2: Obtener fecha de los query params
				const dateParam = searchParams.get('date')
				let dateString: string

				if (dateParam) {
					const [year, month, day] = dateParam.split('-').map(Number)
					const parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0)
					if (!isNaN(parsedDate.getTime())) {
						dateString = dateParam
						setSelectedDate(parsedDate)
					} else {
						const today = new Date()
						today.setHours(0, 0, 0, 0)
						dateString = today.toISOString().split('T')[0]
						setSelectedDate(today)
					}
				} else {
					const today = new Date()
					today.setHours(0, 0, 0, 0)
					dateString = today.toISOString().split('T')[0]
					setSelectedDate(today)
				}

				// Paso 3: Cargar planificación
				const levelParam = levelToUse ? `&levelId=${levelToUse}` : ''
				const planifResponse = await fetch(`/api/planifications?date=${dateString}${levelParam}`)
				
				if (!planifResponse.ok) {
					throw new Error('Error al cargar la planificación')
				}

				const data = await planifResponse.json()

				if (data.data) {
					// Hay planificación
					setPlanification(data.data)
					
					// Actualizar nivel si viene en la respuesta
					if (data.data.discipline_level?.id) {
						const levelId = typeof data.data.discipline_level.id === 'string' 
							? parseInt(data.data.discipline_level.id) 
							: data.data.discipline_level.id
						setSelectedLevelId(levelId)
					}
					
					// Cargar niveles de la disciplina
					if (data.data.discipline?.id) {
						const discId = parseInt(data.data.discipline.id)
						setDisciplineId(discId)
						await fetchDisciplineInfo(discId)
					}
					
					// Cargar workouts
					await fetchExistingWorkouts(data.data.id)
				} else if (data.disciplineId) {
					// No hay planificación pero tenemos disciplina
					setDisciplineId(data.disciplineId)
					setPlanification(null)
					setExistingWodWorkout(null)
					setExistingStrengthWorkout(null)
					await fetchDisciplineInfo(data.disciplineId)
				} else {
					// No hay nada
					setPlanification(null)
					if (data.message) setError(data.message)
				}
			} catch (err) {
				console.error('Error loading data:', err)
				setError('Error al cargar los datos')
			} finally {
				setLoading(false)
				isLoadingRef.current = false
			}
		}

		loadData()
	}, [userId, searchParams.get('date')]) // Solo depende de userId y date, no de selectedLevelId

	// Función para recargar (cuando cambia el nivel manualmente)
	const reloadWithLevel = useCallback(async (newLevelId: number) => {
		if (!userId) return
		
		setSelectedLevelId(newLevelId)
		setLoading(true)
		
		try {
			const dateParam = searchParams.get('date')
			const dateString = dateParam || new Date().toISOString().split('T')[0]
			
			const response = await fetch(`/api/planifications?date=${dateString}&levelId=${newLevelId}`)
			if (!response.ok) throw new Error('Error al cargar')
			
			const data = await response.json()
			
			if (data.data) {
				setPlanification(data.data)
				await fetchExistingWorkouts(data.data.id)
			} else {
				setPlanification(null)
			}
		} catch (error) {
			console.error('Error reloading:', error)
		} finally {
			setLoading(false)
		}
	}, [userId, searchParams.get('date'), fetchExistingWorkouts])

	return {
		planification,
		loading,
		error,
		selectedDate,
		existingWodWorkout,
		existingStrengthWorkout,
		setExistingWodWorkout,
		setExistingStrengthWorkout,
		// Estados para nivel
		disciplineId,
		disciplineName,
		levels,
		selectedLevelId,
		setSelectedLevelId: reloadWithLevel,
	}
}
