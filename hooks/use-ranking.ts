import { useState, useEffect } from 'react'
import { formatDateString } from '@/lib/ranking-helpers'

export interface RankingParticipant {
	id: string
	user_id: string
	user_name: string
	duration_seconds: number | null
	completed_at: string
	weight: number | null
	notes?: string | null
	rank: number
}

export interface Ranking {
	date: string
	wod_name: string
	type: 'time' | 'strength'
	participants: RankingParticipant[]
	total_participants: number
}

export interface RankingData {
	date: string
	rankings: Ranking[]
}

export const useRanking = (userId: string | number | undefined, selectedDate: Date) => {
	const [rankingData, setRankingData] = useState<RankingData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchRanking = async () => {
			if (!userId) {
				setLoading(false)
				return
			}

			try {
				setLoading(true)
				const dateString = formatDateString(selectedDate)
				const response = await fetch(
					`/api/workouts/ranking?date=${dateString}`
				)

				if (!response.ok) {
					const errorData = await response
						.json()
						.catch(() => ({ error: 'Error desconocido' }))
					throw new Error(errorData.error || 'Error al cargar el ranking')
				}

				const data = await response.json()

				if (data && typeof data === 'object') {
					setRankingData({
						date: data.date || dateString,
						rankings: Array.isArray(data.rankings) ? data.rankings : [],
					})
				} else {
					setRankingData({
						date: dateString,
						rankings: [],
					})
				}
			} catch (error) {
				console.error('Error fetching ranking:', error)
				const dateString = formatDateString(selectedDate)
				setRankingData({
					date: dateString,
					rankings: [],
				})
			} finally {
				setLoading(false)
			}
		}

		fetchRanking()
	}, [userId, selectedDate])

	return { rankingData, loading }
}
