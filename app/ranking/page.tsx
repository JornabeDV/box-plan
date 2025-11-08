"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
	Trophy, 
	ArrowLeft,
	Loader2,
	Medal,
	Clock,
	Users
} from "lucide-react"

interface RankingParticipant {
	id: string
	user_id: string
	user_name: string
	duration_seconds: number
	completed_at: string
	notes?: string | null
	rank: number
}

interface Ranking {
	wod_name: string
	participants: RankingParticipant[]
	total_participants: number
}

interface RankingData {
	date: string
	rankings: Ranking[]
}

export default function RankingPage() {
	const router = useRouter()
	const { user, loading: authLoading } = useAuth()
	const [rankingData, setRankingData] = useState<RankingData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchRanking = async () => {
			if (!user?.id) {
				setLoading(false)
				return
			}

			try {
				setLoading(true)
				// Obtener el día anterior
				const yesterday = new Date()
				yesterday.setDate(yesterday.getDate() - 1)
				const year = yesterday.getFullYear()
				const month = String(yesterday.getMonth() + 1).padStart(2, '0')
				const day = String(yesterday.getDate()).padStart(2, '0')
				const dateString = `${year}-${month}-${day}`

				const response = await fetch(`/api/workouts/ranking?date=${dateString}`)
				
				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
					throw new Error(errorData.error || 'Error al cargar el ranking')
				}

				const data = await response.json()
				
				// Asegurar que la estructura de datos sea correcta
				if (data && typeof data === 'object') {
					setRankingData({
						date: data.date || dateString,
						rankings: Array.isArray(data.rankings) ? data.rankings : []
					})
				} else {
					setRankingData({
						date: dateString,
						rankings: []
					})
				}
			} catch (error) {
				console.error('Error fetching ranking:', error)
				// Establecer datos vacíos en caso de error
				const yesterday = new Date()
				yesterday.setDate(yesterday.getDate() - 1)
				const year = yesterday.getFullYear()
				const month = String(yesterday.getMonth() + 1).padStart(2, '0')
				const day = String(yesterday.getDate()).padStart(2, '0')
				const dateString = `${year}-${month}-${day}`
				setRankingData({
					date: dateString,
					rankings: []
				})
			} finally {
				setLoading(false)
			}
		}

		fetchRanking()
	}, [user?.id])

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString + 'T00:00:00')
		return date.toLocaleDateString('es-ES', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	}

	const getRankIcon = (rank: number) => {
		if (rank === 1) return <Medal className="w-5 h-5 text-yellow-400 fill-yellow-400" />
		if (rank === 2) return <Medal className="w-5 h-5 text-gray-300 fill-gray-300" />
		if (rank === 3) return <Medal className="w-5 h-5 text-orange-400 fill-orange-400" />
		return null
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-background text-foreground flex items-center justify-center">
				<div className="flex items-center gap-2">
					<Loader2 className="w-6 h-6 animate-spin text-lime-400" />
					<span>Cargando...</span>
				</div>
			</div>
		)
	}

	if (!user) {
		return (
			<div className="min-h-screen bg-background text-foreground flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-bold mb-4">No autorizado</h2>
					<Button onClick={() => router.push('/login')}>
						Iniciar Sesión
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />

			<main className="p-6 space-y-6 pb-32 max-w-6xl mx-auto">
				{/* Header */}
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.back()}
						className="flex items-center gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</Button>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<Trophy className="w-8 h-8 text-lime-400" />
						Ranking
					</h1>
				</div>

				{/* Fecha */}
				{rankingData && (
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center gap-2 text-muted-foreground">
								<Clock className="w-4 h-4" />
								<span>Ranking del {formatDate(rankingData.date)}</span>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Rankings por WOD */}
				{!rankingData ? (
					<Card>
						<CardContent className="pt-6 text-center py-12">
							<Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-lime-400 opacity-50" />
							<p className="text-muted-foreground">
								Cargando ranking...
							</p>
						</CardContent>
					</Card>
				) : rankingData.rankings.length === 0 ? (
					<Card>
						<CardContent className="pt-6 text-center py-12">
							<Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
							<p className="text-muted-foreground">
								No hay rankings disponibles para esta fecha
							</p>
						</CardContent>
					</Card>
				) : (
					rankingData.rankings.map((ranking) => (
						<Card key={ranking.wod_name}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-xl">{ranking.wod_name}</CardTitle>
									<Badge variant="secondary" className="flex items-center gap-1">
										<Users className="w-3 h-3" />
										{ranking.total_participants} participante{ranking.total_participants !== 1 ? 's' : ''}
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{ranking.participants.map((participant) => (
										<div
											key={participant.id}
											className={`flex items-center justify-between p-4 rounded-lg border ${
												participant.rank <= 3
													? participant.rank === 1
														? 'bg-yellow-400/10 border-yellow-400/30'
														: participant.rank === 2
														? 'bg-gray-300/10 border-gray-300/30'
														: 'bg-orange-400/10 border-orange-400/30'
													: 'bg-card'
											}`}
										>
											<div className="flex items-center gap-3 flex-1">
												<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
													{getRankIcon(participant.rank) || (
														<span className="text-sm font-bold">{participant.rank}</span>
													)}
												</div>
												<div>
													<div className="font-semibold">
														{participant.user_name}
														{participant.user_id === user?.id && (
															<Badge variant="outline" className="ml-2 text-xs">
																Tú
															</Badge>
														)}
													</div>
													{participant.notes && (
														<div className="text-xs text-muted-foreground">
															{participant.notes}
														</div>
													)}
												</div>
											</div>
											<div className="text-right">
												<div className="text-lg font-bold text-lime-400">
													{formatDuration(participant.duration_seconds)}
												</div>
												<div className="text-xs text-muted-foreground">Tiempo</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					))
				)}
			</main>

			<BottomNavigation />
		</div>
	)
}