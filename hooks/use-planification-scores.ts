'use client'

import { useWorkouts } from './use-workouts'
import { useToast } from './use-toast'
import type { WorkoutScore } from '@/components/planification/types'

interface UsePlanificationScoresProps {
	planificationId: string | undefined
	userId: string | number | undefined
	existingWodWorkout: WorkoutScore | null
	existingStrengthWorkout: WorkoutScore | null
	onWodWorkoutUpdate: (workout: WorkoutScore) => void
	onStrengthWorkoutUpdate: (workout: WorkoutScore) => void
}

export function usePlanificationScores({
	planificationId,
	userId,
	existingWodWorkout,
	existingStrengthWorkout,
	onWodWorkoutUpdate,
	onStrengthWorkoutUpdate
}: UsePlanificationScoresProps) {
	const { logWorkout, updateWorkout } = useWorkouts()
	const { toast } = useToast()

	const formatTime = (totalSeconds: number | null): string => {
		if (!totalSeconds) return '00:00'
		const mins = Math.floor(totalSeconds / 60)
		const secs = totalSeconds % 60
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
	}

	const handleSaveWodScore = async (workout: WorkoutScore): Promise<void> => {
		if (!userId || !planificationId) {
			toast({
				title: 'Error',
				description: 'Debes estar autenticado para guardar el tiempo',
				variant: 'destructive'
			})
			return
		}

		try {
			const completedAt = workout.completed_at || new Date().toISOString()
			const workoutData: any = {
				planification_id: String(planificationId),
				data: {
					type: 'wod_score'
				},
				completed_at: completedAt,
				duration_seconds: workout.duration_seconds
			}

			if (existingWodWorkout) {
				const result = await updateWorkout?.(existingWodWorkout.id, {
					duration_seconds: workout.duration_seconds,
					completed_at: completedAt
				})

				if (result) {
					onWodWorkoutUpdate({
						...existingWodWorkout,
						duration_seconds: workout.duration_seconds,
						completed_at: completedAt
					})
					toast({
						title: '¡Tiempo actualizado! 🎉',
						description: `Tiempo guardado: ${formatTime(workout.duration_seconds)}`,
					})
				}
			} else {
				const result = await logWorkout?.(workoutData)

				if (result) {
					onWodWorkoutUpdate({
						id: String(result.id),
						duration_seconds: workout.duration_seconds,
						completed_at: completedAt
					})
					toast({
						title: '¡Tiempo guardado! 🎉',
						description: `Tiempo registrado: ${formatTime(workout.duration_seconds)}`,
					})
				}
			}
		} catch (error) {
			console.error('Error saving WOD score:', error)
			toast({
				title: 'Error',
				description: 'No se pudo guardar el tiempo. Intenta nuevamente.',
				variant: 'destructive'
			})
		}
	}

	const handleSaveStrengthScore = async (workout: WorkoutScore): Promise<void> => {
		if (!userId || !planificationId) {
			toast({
				title: 'Error',
				description: 'Debes estar autenticado para guardar el peso',
				variant: 'destructive'
			})
			return
		}

		try {
			const completedAt = workout.completed_at || new Date().toISOString()
			const workoutData: any = {
				planification_id: String(planificationId),
				data: {
					type: 'strength_score',
					weight: workout.weight
				},
				completed_at: completedAt,
				duration_seconds: null
			}

			if (existingStrengthWorkout) {
				const result = await updateWorkout?.(existingStrengthWorkout.id, {
					data: {
						type: 'strength_score',
						weight: workout.weight
					},
					completed_at: completedAt
				})

				if (result) {
					const updatedWeight = (result.data as any)?.weight || workout.weight
					onStrengthWorkoutUpdate({
						...existingStrengthWorkout,
						weight: updatedWeight,
						completed_at: result.completed_at || completedAt
					})
					toast({
						title: '¡Peso actualizado! 🎉',
						description: `Peso guardado: ${updatedWeight} kg`,
					})
				}
			} else {
				const result = await logWorkout?.(workoutData)

				if (result) {
					const savedWeight = (result.data as any)?.weight || workout.weight
					onStrengthWorkoutUpdate({
						id: String(result.id),
						duration_seconds: null,
						completed_at: result.completed_at || completedAt,
						weight: savedWeight
					})
					toast({
						title: '¡Peso guardado! 🎉',
						description: `Peso registrado: ${savedWeight} kg`,
					})
				}
			}
		} catch (error) {
			console.error('Error saving strength score:', error)
			toast({
				title: 'Error',
				description: 'No se pudo guardar el peso. Intenta nuevamente.',
				variant: 'destructive'
			})
		}
	}

	return {
		handleSaveWodScore,
		handleSaveStrengthScore
	}
}
