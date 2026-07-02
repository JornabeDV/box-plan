'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Planification, WorkoutScore } from '@/components/planification/types'
import { useUserDisciplines } from './use-user-disciplines'

interface UsePlanificationDataProps {
	userId?: string | number
}

export interface DisciplineLevel {
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

	// Estados para disciplina y nivel
	const [disciplineId, setDisciplineId] = useState<number | null>(null)
	const [disciplineName, setDisciplineName] = useState('')
	const [availableDisciplineOptions, setAvailableDisciplineOptions] = useState<Array<{
		id: number
		name: string
		color: string
		levelId: number | null
		levelName: string | null
	}>>([])

	// Hook para disciplinas del usuario
	const { disciplines: userDisciplines, loading: disciplinesLoading } = useUserDisciplines()

	// Ref para que reloadWithLevel siempre tenga el disciplineId actualizado
	const disciplineIdRef = useRef<number | null>(null)
	useEffect(() => {
		disciplineIdRef.current = disciplineId
	}, [disciplineId])

	// Poblar opciones disponibles de disciplinas
	useEffect(() => {
		if (!disciplinesLoading && userDisciplines.length > 0) {
			const options = userDisciplines.map(userDiscipline => ({
				id: userDiscipline.disciplineId,
				name: userDiscipline.discipline?.name || 'Sin nombre',
				color: userDiscipline.discipline?.color || '#3B82F6',
				levelId: userDiscipline.levelId,
				levelName: userDiscipline.level?.name || null,
			}))
			setAvailableDisciplineOptions(options)
		} else if (!disciplinesLoading) {
			setAvailableDisciplineOptions([])
		}
	}, [userDisciplines, disciplinesLoading])

	const [levels, setLevels] = useState<DisciplineLevel[]>([])
	const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
	const [needsLevel, setNeedsLevel] = useState(false)

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

	// Efecto principal: reacciona a cambios de fecha Y disciplina en la URL
	useEffect(() => {
		if (!userId || disciplinesLoading) {
			setLoading(disciplinesLoading)
			return
		}

		let cancelled = false
		setLoading(true)
		setError(null)
		setPlanification(null)

		const loadData = async () => {
			try {
					// Leer disciplineId de la URL
					const urlDisciplineId = searchParams.get('disciplineId')
						? parseInt(searchParams.get('disciplineId')!, 10)
						: null

					let initialDisciplineId: number | null = urlDisciplineId

					// Si no hay disciplineId en la URL, usar la primera disciplina del usuario
					// Si no tiene disciplinas, dejar null para que el backend busque planificaciones personalizadas
					if (!initialDisciplineId && userDisciplines.length > 0) {
						initialDisciplineId = userDisciplines[0].disciplineId
					}

					if (cancelled) return

					if (initialDisciplineId) {
						setDisciplineId(initialDisciplineId)
						disciplineIdRef.current = initialDisciplineId
					}

					// Determinar nivel a usar: preferredLevelId del atleta, fallback a levelId del coach
					const userDisciplineForCurrent = userDisciplines.find(
						ud => ud.disciplineId === initialDisciplineId
					)
					const levelToUse = userDisciplineForCurrent?.preferredLevelId
						?? userDisciplineForCurrent?.levelId
						?? null

					if (levelToUse && !cancelled) {
						setSelectedLevelId(levelToUse)
					}

				// Paso 3: Obtener fecha
				const dateParam = searchParams.get('date')
				let dateString: string

				if (dateParam) {
					const [year, month, day] = dateParam.split('-').map(Number)
					const parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0)
					if (!isNaN(parsedDate.getTime())) {
						dateString = dateParam
						if (!cancelled) setSelectedDate(parsedDate)
					} else {
						const today = new Date()
						today.setHours(0, 0, 0, 0)
						dateString = today.toISOString().split('T')[0]
						if (!cancelled) setSelectedDate(today)
					}
				} else {
					const today = new Date()
					today.setHours(0, 0, 0, 0)
					dateString = today.toISOString().split('T')[0]
					if (!cancelled) setSelectedDate(today)
				}

				// Paso 4: Cargar planificación
					// Paso 4: Cargar planificación
					// No pasamos levelId en la carga inicial para que el backend use el nivel favorito
					// y haga fallback si es necesario. Solo pasamos levelId en reloadWithLevel (cambio manual).
					const disciplineParam = initialDisciplineId ? `&disciplineId=${initialDisciplineId}` : ''
					const planifResponse = await fetch(`/api/planifications?date=${dateString}${disciplineParam}`)

				if (!planifResponse.ok) {
					throw new Error('Error al cargar la planificación')
				}

				if (cancelled) return

				const data = await planifResponse.json()

				if (data.data) {
					setNeedsLevel(false)
					setPlanification(data.data)

					if (data.data.discipline_level?.id) {
						const levelId = typeof data.data.discipline_level.id === 'string'
							? parseInt(data.data.discipline_level.id)
							: data.data.discipline_level.id
						setSelectedLevelId(levelId)
					}

					if (data.data.discipline?.id) {
						const discId = parseInt(data.data.discipline.id)
						setDisciplineId(discId)
						disciplineIdRef.current = discId
						await fetchDisciplineInfo(discId)
					}

					await fetchExistingWorkouts(data.data.id)
				} else if (data.needsLevel) {
					setNeedsLevel(true)
					setPlanification(null)
					setExistingWodWorkout(null)
					setExistingStrengthWorkout(null)
					if (data.disciplineId) {
						setDisciplineId(data.disciplineId)
						disciplineIdRef.current = data.disciplineId
						await fetchDisciplineInfo(data.disciplineId)
					}
				} else if (data.disciplineId) {
					setNeedsLevel(false)
					setDisciplineId(data.disciplineId)
					disciplineIdRef.current = data.disciplineId
					setPlanification(null)
					setExistingWodWorkout(null)
					setExistingStrengthWorkout(null)
					await fetchDisciplineInfo(data.disciplineId)
				} else {
					setNeedsLevel(false)
					setPlanification(null)
					if (data.message) setError(data.message)
				}
			} catch (err) {
				if (!cancelled) {
					console.error('Error loading data:', err)
					setError('Error al cargar los datos')
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		loadData()

		return () => {
			cancelled = true
		}
	}, [userId, searchParams.get('date'), searchParams.get('disciplineId'), disciplinesLoading, userDisciplines]) // Reacciona a fecha, disciplina URL y carga de disciplinas

	// Función para recargar cuando cambia el nivel manualmente
	// Usa disciplineIdRef para evitar stale closure
	const reloadWithLevel = useCallback(async (newLevelId: number) => {
		if (!userId) return

		setSelectedLevelId(newLevelId)
		setLoading(true)

		try {
			const dateParam = searchParams.get('date')
			const dateString = dateParam || new Date().toISOString().split('T')[0]

			// Usar ref para obtener el disciplineId actual (evita stale closure)
			const currentDisciplineId = disciplineIdRef.current
			const disciplineParam = currentDisciplineId ? `&disciplineId=${currentDisciplineId}` : ''
			const response = await fetch(`/api/planifications?date=${dateString}&levelId=${newLevelId}${disciplineParam}`)
			if (!response.ok) throw new Error('Error al cargar')

			const data = await response.json()

			if (data.data) {
				setPlanification(data.data)
				await fetchExistingWorkouts(data.data.id)
				} else {
					setPlanification(null)
					setExistingWodWorkout(null)
					setExistingStrengthWorkout(null)
					if (data.message) setError(data.message)
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
		disciplineId,
		disciplineName,
		levels,
		selectedLevelId,
		needsLevel,
		setNeedsLevel,
		setSelectedLevelId: reloadWithLevel,
		availableDisciplineOptions,
	}
}
