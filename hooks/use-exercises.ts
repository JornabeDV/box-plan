'use client'

import { useMemo } from 'react'
import { EXERCISES, getExercisesByCategory, getExerciseNames, type Exercise } from '@/lib/exercises'

export function useExercises(category?: string) {
	// Filtrar ejercicios por categoría si se especifica
	const exercises = useMemo(() => {
		if (category) {
			return EXERCISES.filter(e => e.category === category)
		}
		return EXERCISES
	}, [category])

	// Obtener ejercicios agrupados por categoría
	const exercisesByCategory = useMemo(() => {
		return getExercisesByCategory()
	}, [])

	// Obtener solo los nombres ordenados
	const exerciseNames = useMemo(() => {
		return getExerciseNames()
	}, [])

	return {
		exercises,
		exercisesByCategory,
		exerciseNames,
		loading: false,
		error: null,
	}
}