export interface Exercise {
	name: string
	category: string
}

export const EXERCISES: Exercise[] = [
	// Lower Body
	{ name: 'Back Squat', category: 'Lower Body' },
	{ name: 'Front Squat', category: 'Lower Body' },
	{ name: 'Overhead Squat', category: 'Lower Body' },
	{ name: 'Deadlift', category: 'Lower Body' },
	{ name: 'Romanian Deadlift', category: 'Lower Body' },
	{ name: 'Sumo Deadlift', category: 'Lower Body' },
	{ name: 'Leg Press', category: 'Lower Body' },
	
	// Upper Body - Push
	{ name: 'Bench Press', category: 'Upper Body' },
	{ name: 'Incline Bench Press', category: 'Upper Body' },
	{ name: 'Overhead Press', category: 'Upper Body' },
	{ name: 'Push Press', category: 'Upper Body' },
	{ name: 'Strict Press', category: 'Upper Body' },
	{ name: 'Weighted Dips', category: 'Upper Body' },
	
	// Upper Body - Pull
	{ name: 'Weighted Pull-up', category: 'Upper Body' },
	{ name: 'Bent Over Row', category: 'Upper Body' },
	{ name: 'Pendlay Row', category: 'Upper Body' },
	
	// Olympic Lifts
	{ name: 'Snatch', category: 'Olympic Lifts' },
	{ name: 'Power Snatch', category: 'Olympic Lifts' },
	{ name: 'Hang Snatch', category: 'Olympic Lifts' },
	{ name: 'Clean', category: 'Olympic Lifts' },
	{ name: 'Power Clean', category: 'Olympic Lifts' },
	{ name: 'Hang Clean', category: 'Olympic Lifts' },
	{ name: 'Clean & Jerk', category: 'Olympic Lifts' },
	{ name: 'Jerk', category: 'Olympic Lifts' },
	{ name: 'Split Jerk', category: 'Olympic Lifts' },
	{ name: 'Push Jerk', category: 'Olympic Lifts' },
]

// Obtener ejercicios agrupados por categoría
export function getExercisesByCategory(): Record<string, Exercise[]> {
	return EXERCISES.reduce((acc, exercise) => {
		if (!acc[exercise.category]) {
			acc[exercise.category] = []
		}
		acc[exercise.category].push(exercise)
		return acc
	}, {} as Record<string, Exercise[]>)
}

// Obtener todas las categorías únicas
export function getCategories(): string[] {
	return Array.from(new Set(EXERCISES.map(e => e.category))).sort()
}

// Buscar ejercicio por nombre
export function findExercise(name: string): Exercise | undefined {
	return EXERCISES.find(e => e.name.toLowerCase() === name.toLowerCase())
}

// Obtener solo los nombres de los ejercicios
export function getExerciseNames(): string[] {
	return EXERCISES.map(e => e.name).sort()
}