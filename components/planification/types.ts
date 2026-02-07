export interface Planification {
	id: string
	discipline_id: string
	discipline_level_id: string
	date: string
	estimated_duration?: number
	blocks: Array<{
		id: string
		title: string
		items: string[]
		order: number
		notes?: string
	}>
	notes?: string
	// Campos de personalización
	is_personalized?: boolean
	target_user_id?: string | null
	target_user?: {
		id: string
		name: string
		email: string
	} | null
	discipline?: {
		id: string
		name: string
		color: string
		icon: string
	}
	discipline_level?: {
		id: string
		name: string
		description?: string
	}
}

export interface WorkoutScore {
	id: string
	duration_seconds: number | null
	completed_at: string | null
	weight?: number | null
}
