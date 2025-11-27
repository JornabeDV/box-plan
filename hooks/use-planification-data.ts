'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Planification, WorkoutScore } from '@/components/planification/types'

interface UsePlanificationDataProps {
	userId?: string | number
}

export function usePlanificationData({ userId }: UsePlanificationDataProps) {
	const searchParams = useSearchParams()
	const [planification, setPlanification] = useState<Planification | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [existingWodWorkout, setExistingWodWorkout] = useState<WorkoutScore | null>(null)
	const [existingStrengthWorkout, setExistingStrengthWorkout] = useState<WorkoutScore | null>(null)

	useEffect(() => {
		if (!userId) {
			setLoading(false)
			return
		}

		// Obtener la fecha de los query params o usar hoy
		const dateParam = searchParams.get('date')
		let dateString: string
		let parsedDate: Date

		if (dateParam) {
			const [year, month, day] = dateParam.split('-').map(Number)
			parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0)
			if (!isNaN(parsedDate.getTime())) {
				dateString = dateParam
				setSelectedDate(parsedDate)
			} else {
				const today = new Date()
				today.setHours(0, 0, 0, 0)
				const year = today.getFullYear()
				const month = String(today.getMonth() + 1).padStart(2, '0')
				const day = String(today.getDate()).padStart(2, '0')
				dateString = `${year}-${month}-${day}`
				setSelectedDate(today)
			}
		} else {
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			const year = today.getFullYear()
			const month = String(today.getMonth() + 1).padStart(2, '0')
			const day = String(today.getDate()).padStart(2, '0')
			dateString = `${year}-${month}-${day}`
			setSelectedDate(today)
		}

		setLoading(true)
		setError(null)
		setPlanification(null)

		fetch(`/api/planifications?date=${dateString}`)
			.then(response => {
				if (!response.ok) {
					throw new Error('Error al cargar la planificación')
				}
				return response.json()
			})
			.then(data => {
				if (data.data) {
					setPlanification(data.data)
					fetchExistingWorkouts(data.data.id)
				} else {
					setPlanification(null)
					if (data.message) {
						setError(data.message)
					}
				}
			})
			.catch(err => {
				console.error('Error fetching planification:', err)
				setError('Error al cargar la planificación')
				setPlanification(null)
			})
			.finally(() => {
				setLoading(false)
			})
	}, [userId, searchParams])

	const fetchExistingWorkouts = async (planificationId: string) => {
		if (!userId || !planificationId) return

		try {
			const userIdStr = String(userId)
			const response = await fetch(`/api/workouts?userId=${userIdStr}`)
			if (response.ok) {
				const workouts = await response.json()
				const planificationIdNum = parseInt(planificationId, 10)

				const wodWorkout = workouts.find((w: any) => {
					const wPlanificationId = w.planification_id !== null && w.planification_id !== undefined
						? Number(w.planification_id)
						: null
					return wPlanificationId === planificationIdNum && w.data?.type === 'wod_score'
				})

				const strengthWorkout = workouts.find((w: any) => {
					const wPlanificationId = w.planification_id !== null && w.planification_id !== undefined
						? Number(w.planification_id)
						: null
					return wPlanificationId === planificationIdNum && w.data?.type === 'strength_score'
				})

				if (wodWorkout) {
					setExistingWodWorkout({
						id: String(wodWorkout.id),
						duration_seconds: wodWorkout.duration_seconds,
						completed_at: wodWorkout.completed_at
					})
				}

				if (strengthWorkout) {
					setExistingStrengthWorkout({
						id: String(strengthWorkout.id),
						duration_seconds: null,
						completed_at: strengthWorkout.completed_at,
						weight: strengthWorkout.data?.weight || null
					})
				}
			}
		} catch (error) {
			console.error('Error fetching existing workouts:', error)
		}
	}

	return {
		planification,
		loading,
		error,
		selectedDate,
		existingWodWorkout,
		existingStrengthWorkout,
		setExistingWodWorkout,
		setExistingStrengthWorkout
	}
}
