"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { useAuth } from "@/hooks/use-auth"
import { useWorkouts } from "@/hooks/use-workouts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
	Clock, 
	Plus, 
	X, 
	ArrowLeft,
	Loader2,
	CheckCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WODScore {
	id: string
	wodName: string
	minutes: string
	seconds: string
	notes?: string
}

export default function CargaScorePage() {
	const router = useRouter()
	const { user, loading: authLoading } = useAuth()
	const { logWorkout } = useWorkouts()
	const { toast } = useToast()
	const [wods, setWods] = useState<WODScore[]>([
		{ id: '1', wodName: '', minutes: '', seconds: '', notes: '' }
	])
	const [loading, setLoading] = useState(false)
	const [planification, setPlanification] = useState<any>(null)

	useEffect(() => {
		const fetchTodayPlanification = async () => {
			if (!user?.id) return

			try {
				const today = new Date()
				const year = today.getFullYear()
				const month = String(today.getMonth() + 1).padStart(2, '0')
				const day = String(today.getDate()).padStart(2, '0')
				const dateString = `${year}-${month}-${day}`

				const response = await fetch(`/api/planifications/today?date=${dateString}`)
				if (response.ok) {
					const data = await response.json()
					if (data.data) {
						setPlanification(data.data)
						// Si hay bloques con WODs, prellenar los nombres
						if (data.data.blocks && data.data.blocks.length > 0) {
							const wodNames = data.data.blocks
								.filter((block: any) => block.title.toLowerCase().includes('wod') || block.title.toLowerCase().includes('entrenamiento'))
								.map((block: any) => block.title)
							
							if (wodNames.length > 0) {
								setWods(wodNames.map((name: string, index: number) => ({
									id: String(index + 1),
									wodName: name,
									minutes: '',
									seconds: '',
									notes: ''
								})))
							}
						}
					}
				}
			} catch (error) {
				console.error('Error fetching planification:', error)
			}
		}

		fetchTodayPlanification()
	}, [user?.id])

	const handleAddWOD = () => {
		setWods([...wods, {
			id: String(Date.now()),
			wodName: '',
			minutes: '',
			seconds: '',
			notes: ''
		}])
	}

	const handleRemoveWOD = (id: string) => {
		if (wods.length > 1) {
			setWods(wods.filter(wod => wod.id !== id))
		}
	}

	const handleWODChange = (id: string, field: keyof WODScore, value: string) => {
		setWods(wods.map(wod => 
			wod.id === id ? { ...wod, [field]: value } : wod
		))
	}

	const validateTime = (minutes: string, seconds: string): boolean => {
		const mins = parseInt(minutes) || 0
		const secs = parseInt(seconds) || 0
		return mins >= 0 && secs >= 0 && secs < 60
	}

	const handleSubmit = async () => {
		if (!user?.id) {
			toast({
				title: 'Error',
				description: 'Debes estar autenticado para cargar scores',
				variant: 'destructive'
			})
			return
		}

		// Validar que todos los WODs tengan nombre y tiempo
		const invalidWODs = wods.filter(wod => 
			!wod.wodName.trim() || 
			!wod.minutes.trim() || 
			!wod.seconds.trim() ||
			!validateTime(wod.minutes, wod.seconds)
		)

		if (invalidWODs.length > 0) {
			toast({
				title: 'Error de validación',
				description: 'Todos los WODs deben tener nombre, minutos y segundos válidos',
				variant: 'destructive'
			})
			return
		}

		setLoading(true)

		try {
			const completedAt = new Date().toISOString()
			
			// Guardar cada WOD como un workout separado
			const promises = wods.map(async (wod) => {
				const minutes = parseInt(wod.minutes) || 0
				const seconds = parseInt(wod.seconds) || 0
				const durationSeconds = minutes * 60 + seconds

				const workoutData = {
					sheet_id: planification?.id || 'manual', // Si no hay planificación, usar 'manual'
					data: {
						wod_name: wod.wodName,
						notes: wod.notes || '',
						type: 'wod_score'
					},
					completed_at: completedAt,
					duration_seconds: durationSeconds
				}

				return logWorkout?.(workoutData)
			})

			await Promise.all(promises)

			toast({
				title: '¡Scores cargados! 🎉',
				description: `Se registraron ${wods.length} WOD${wods.length > 1 ? 's' : ''} exitosamente`,
			})

			// Limpiar formulario
			setWods([{ id: '1', wodName: '', minutes: '', seconds: '', notes: '' }])
			
			// Redirigir después de un breve delay
			setTimeout(() => {
				router.push('/progress')
			}, 1500)
		} catch (error) {
			console.error('Error saving scores:', error)
			toast({
				title: 'Error',
				description: 'No se pudieron guardar los scores. Intenta nuevamente.',
				variant: 'destructive'
			})
		} finally {
			setLoading(false)
		}
	}

	if (authLoading) {
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

			<main className="p-6 space-y-6 pb-32 max-w-4xl mx-auto">
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
						<Clock className="w-8 h-8 text-lime-400" />
						Carga de Score
					</h1>
				</div>

				{/* Información */}
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">
							Registra los tiempos de tus WODs. Puedes agregar múltiples WODs si realizaste más de uno.
						</p>
					</CardContent>
				</Card>

				{/* Formulario de WODs */}
				<div className="space-y-4">
					{wods.map((wod, index) => (
						<Card key={wod.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">
										WOD {index + 1}
									</CardTitle>
									{wods.length > 1 && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveWOD(wod.id)}
											className="text-destructive"
										>
											<X className="w-4 h-4" />
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor={`wod-name-${wod.id}`}>Nombre del WOD</Label>
									<Input
										id={`wod-name-${wod.id}`}
										placeholder="Ej: Fran, Murph, Cindy..."
										value={wod.wodName}
										onChange={(e) => handleWODChange(wod.id, 'wodName', e.target.value)}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor={`minutes-${wod.id}`}>Minutos</Label>
										<Input
											id={`minutes-${wod.id}`}
											type="number"
											min="0"
											placeholder="0"
											value={wod.minutes}
											onChange={(e) => handleWODChange(wod.id, 'minutes', e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={`seconds-${wod.id}`}>Segundos</Label>
										<Input
											id={`seconds-${wod.id}`}
											type="number"
											min="0"
											max="59"
											placeholder="0"
											value={wod.seconds}
											onChange={(e) => handleWODChange(wod.id, 'seconds', e.target.value)}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor={`notes-${wod.id}`}>Notas (opcional)</Label>
									<Input
										id={`notes-${wod.id}`}
										placeholder=""
										value={wod.notes || ''}
										onChange={(e) => handleWODChange(wod.id, 'notes', e.target.value)}
									/>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Botón para agregar más WODs */}
				<Button
					variant="outline"
					onClick={handleAddWOD}
					className="w-full"
				>
					<Plus className="w-4 h-4 mr-2" />
					Agregar otro WOD
				</Button>

				{/* Botón de guardar */}
				<Button
					onClick={handleSubmit}
					disabled={loading}
					className="w-full"
					size="lg"
				>
					{loading ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Guardando...
						</>
					) : (
						<>
							<CheckCircle className="w-4 h-4 mr-2" />
							Guardar Scores
						</>
					)}
				</Button>
			</main>

			<BottomNavigation />
		</div>
	)
}