import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDateString = (date: Date): string => {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export const formatDuration = (seconds: number | null): string => {
	if (!seconds) return 'N/A'
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatDate = (dateString: string): string => {
	const date = new Date(dateString + 'T00:00:00')
	return date.toLocaleDateString('es-ES', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

export const getLast7Days = (): Date[] => {
	const days: Date[] = []
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	for (let i = 1; i <= 7; i++) {
		const date = new Date(today)
		date.setDate(date.getDate() - i)
		days.push(date)
	}

	return days
}

export const formatDateForDisplay = (date: Date): string => {
	return format(date, 'PPP', { locale: es })
}

export const formatDateShort = (date: Date): string => {
	const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' })
	const dayNumber = date.getDate()
	const monthName = date.toLocaleDateString('es-ES', { month: 'short' })
	return `${dayName}, ${dayNumber} ${monthName}`
}
