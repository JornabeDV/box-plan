"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { useAuth } from "@/hooks/use-auth"
import { useWorkouts } from "@/hooks/use-workouts"
import { useRMs } from "@/hooks/use-rms"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
	BarChart3, 
	TrendingUp, 
	Calendar, 
	Timer, 
	Target,
	ArrowLeft,
	Loader2,
	Weight
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function ProgresoPage() {
	const router = useRouter()
	const { user, loading: authLoading } = useAuth()
	const { workouts, loading: workoutsLoading, getUserStats } = useWorkouts()
	const { rmRecords, loading: rmsLoading } = useRMs()
	const [stats, setStats] = useState<any>(null)
	const [loadingStats, setLoadingStats] = useState(true)

	useEffect(() => {
		const loadStats = async () => {
			if (user?.id && getUserStats) {
				setLoadingStats(true)
				try {
					const statsData = await getUserStats()
					setStats(statsData)
				} catch (error) {
					console.error('Error loading stats:', error)
					setStats(null)
				} finally {
					setLoadingStats(false)
				}
			}
		}
		loadStats()
	}, [user?.id, getUserStats])

	if (authLoading || workoutsLoading) {
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

	const formatDuration = (seconds: number | null) => {
		if (!seconds) return 'N/A'
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	const recentWorkouts = workouts?.slice(0, 5) || []

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
						<BarChart3 className="w-8 h-8 text-lime-400" />
						Mi Progreso
					</h1>
				</div>

				{/* Estadísticas Generales */}
				{loadingStats || rmsLoading ? (
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
						{[1, 2, 3, 4, 5].map((i) => (
							<Card key={i}>
								<CardContent className="pt-6">
									<div className="text-center">
										<Loader2 className="w-6 h-6 animate-spin text-lime-400 mx-auto mb-2" />
										<div className="text-sm text-muted-foreground">Cargando...</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<div className="text-3xl font-bold text-lime-400 mb-1">
										{stats?.totalWorkouts || 0}
									</div>
									<div className="text-sm text-muted-foreground">
										Total Entrenamientos
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<div className="text-3xl font-bold text-blue-400 mb-1">
										{stats?.thisWeek || 0}
									</div>
									<div className="text-sm text-muted-foreground">
										Esta Semana
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<div className="text-3xl font-bold text-purple-400 mb-1">
										{stats?.thisMonth || 0}
									</div>
									<div className="text-sm text-muted-foreground">
										Este Mes
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<div className="text-3xl font-bold text-orange-400 mb-1">
										{stats?.streak || 0}
									</div>
									<div className="text-sm text-muted-foreground">
										Racha (días)
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Card de RMs */}
						<Card 
							className="cursor-pointer hover:bg-gray-900/10 dark:hover:bg-gray-100/5 transition-colors"
							onClick={() => router.push('/log-rm')}
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									router.push('/log-rm')
								}
							}}
							role="button"
							aria-label="Ver repeticiones máximas"
						>
							<CardContent className="pt-6">
								<div className="text-center">
									<div className="text-3xl font-bold text-lime-400 mb-1">
										{rmRecords?.length || 0}
									</div>
									<div className="text-sm text-muted-foreground">
										Mis RMs
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Duración Promedio */}
				{stats && stats.averageDuration > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Timer className="w-5 h-5" />
								Duración Promedio
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-lime-400">
								{formatDuration(Math.round(stats.averageDuration))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Entrenamientos Recientes */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="w-5 h-5" />
							Entrenamientos Recientes
						</CardTitle>
					</CardHeader>
					<CardContent>
						{recentWorkouts.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
								<p>No hay entrenamientos registrados aún</p>
								<Button
									className="mt-4"
									onClick={() => router.push('/log-score')}
								>
									Cargar Primer Entrenamiento
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								{recentWorkouts.map((workout: any) => {
									// Obtener el nombre del entrenamiento desde diferentes fuentes
									const workoutName = 
										workout.planification?.title || 
										workout.data?.wod_name || 
										workout.data?.exercise || 
										'Entrenamiento'
									
									// Obtener duración (puede venir como duration_seconds o durationSeconds)
									const duration = workout.duration_seconds || workout.durationSeconds
									
									// Obtener fecha de completado (puede venir como completed_at o completedAt)
									const completedAt = workout.completed_at || workout.completedAt

									return (
										<div
											key={workout.id}
											className="flex items-center justify-between p-4 bg-card rounded-lg border"
										>
											<div className="flex-1">
												<div className="font-semibold">
													{workoutName}
												</div>
												<div className="text-sm text-muted-foreground">
													{completedAt
														? formatDistanceToNow(new Date(completedAt), {
																addSuffix: true,
																locale: es,
															})
														: 'Fecha no disponible'}
												</div>
											</div>
											{duration && (
												<div className="text-right ml-4">
													<div className="font-bold text-lime-400">
														{formatDuration(duration)}
													</div>
													<div className="text-xs text-muted-foreground">Tiempo</div>
												</div>
											)}
										</div>
									)
								})}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Gráfico de Progreso (Placeholder) */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="w-5 h-5" />
							Tendencia de Entrenamientos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-center py-8 text-muted-foreground">
							<BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
							<p>Gráfico de progreso próximamente</p>
						</div>
					</CardContent>
				</Card>
			</main>

			<BottomNavigation />
		</div>
	)
}