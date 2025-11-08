"use client"

import { useState } from "react"
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
	Weight, 
	Plus, 
	X, 
	ArrowLeft,
	Loader2,
	CheckCircle,
	Calculator
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RMRecord {
	id: string
	exercise: string
	weight: string
	reps: string
	calculatedRM?: number
	notes?: string
}

export default function CargaRMPage() {
	const router = useRouter()
	const { user, loading: authLoading } = useAuth()
	const { logWorkout } = useWorkouts()
	const { toast } = useToast()
	const [rms, setRms] = useState<RMRecord[]>([
		{ id: '1', exercise: '', weight: '', reps: '', notes: '' }
	])
	const [loading, setLoading] = useState(false)

	const calculateOneRM = (weight: number, reps: number): number => {
		if (reps <= 0 || weight <= 0) return 0
		// Fórmula de Brzycki: 1RM = peso / (1.0278 - 0.0278 * reps)
		const calculatedRM = weight / (1.0278 - 0.0278 * reps)
		return Math.round(calculatedRM * 10) / 10
	}

	const handleAddRM = () => {
		setRms([...rms, {
			id: String(Date.now()),
			exercise: '',
			weight: '',
			reps: '',
			notes: ''
		}])
	}

	const handleRemoveRM = (id: string) => {
		if (rms.length > 1) {
			setRms(rms.filter(rm => rm.id !== id))
		}
	}

	const handleRMChange = (id: string, field: keyof RMRecord, value: string) => {
		setRms(rms.map(rm => {
			const updated = { ...rm, [field]: value }
			
			// Calcular 1RM si hay peso y repeticiones
			if (field === 'weight' || field === 'reps') {
				const weight = parseFloat(updated.weight)
				const reps = parseInt(updated.reps)
				if (weight > 0 && reps > 0 && reps <= 10) {
					updated.calculatedRM = calculateOneRM(weight, reps)
				} else {
					updated.calculatedRM = undefined
				}
			}
			
			return updated
		}))
	}

	const handleSubmit = async () => {
		if (!user?.id) {
			toast({
				title: 'Error',
				description: 'Debes estar autenticado para cargar RMs',
				variant: 'destructive'
			})
			return
		}

		// Validar que todos los RMs tengan ejercicio, peso y repeticiones
		const invalidRMs = rms.filter(rm => 
			!rm.exercise.trim() || 
			!rm.weight.trim() || 
			!rm.reps.trim() ||
			parseFloat(rm.weight) <= 0 ||
			parseInt(rm.reps) <= 0
		)

		if (invalidRMs.length > 0) {
			toast({
				title: 'Error de validación',
				description: 'Todos los ejercicios deben tener nombre, peso y repeticiones válidos',
				variant: 'destructive'
			})
			return
		}

		setLoading(true)

		try {
			const completedAt = new Date().toISOString()
			
			// Guardar cada RM como un workout separado
			const promises = rms.map(async (rm) => {
				const weight = parseFloat(rm.weight)
				const reps = parseInt(rm.reps)
				const calculatedRM = calculateOneRM(weight, reps)

				const workoutData = {
					planification_id: null, // Los RMs no están asociados a planificaciones
					data: {
						exercise: rm.exercise,
						weight: weight,
						reps: reps,
						calculated_rm: calculatedRM,
						notes: rm.notes || '',
						type: 'rm_record'
					},
					completed_at: completedAt,
					duration_seconds: null // Los RMs no tienen duración
				}

				return logWorkout?.(workoutData)
			})

			await Promise.all(promises)

			toast({
				title: '¡RMs guardados! 💪',
				description: `Se registraron ${rms.length} repetición${rms.length > 1 ? 'es' : ''} máxima${rms.length > 1 ? 's' : ''} exitosamente`,
			})

			// Limpiar formulario
			setRms([{ id: '1', exercise: '', weight: '', reps: '', notes: '' }])
			
			// Redirigir después de un breve delay
			setTimeout(() => {
				router.push('/progress')
			}, 1500)
		} catch (error) {
			console.error('Error saving RMs:', error)
			toast({
				title: 'Error',
				description: 'No se pudieron guardar los RMs. Intenta nuevamente.',
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
						<Weight className="w-8 h-8 text-lime-400" />
						Carga RM
					</h1>
				</div>

				{/* Información */}
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">
							Registra tus repeticiones máximas. El sistema calculará automáticamente tu 1RM usando la fórmula de Brzycki.
						</p>
					</CardContent>
				</Card>

				{/* Formulario de RMs */}
				<div className="space-y-4">
					{rms.map((rm, index) => (
						<Card key={rm.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">
										Ejercicio {index + 1}
									</CardTitle>
									{rms.length > 1 && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveRM(rm.id)}
											className="text-destructive"
										>
											<X className="w-4 h-4" />
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor={`exercise-${rm.id}`}>Ejercicio</Label>
									<Input
										id={`exercise-${rm.id}`}
										placeholder="Ej: Back Squat, Deadlift, Bench Press..."
										value={rm.exercise}
										onChange={(e) => handleRMChange(rm.id, 'exercise', e.target.value)}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor={`weight-${rm.id}`}>Peso (kg)</Label>
										<Input
											id={`weight-${rm.id}`}
											type="number"
											min="0"
											step="0.5"
											placeholder="0"
											value={rm.weight}
											onChange={(e) => handleRMChange(rm.id, 'weight', e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={`reps-${rm.id}`}>Repeticiones</Label>
										<Input
											id={`reps-${rm.id}`}
											type="number"
											min="1"
											max="10"
											placeholder="1-10"
											value={rm.reps}
											onChange={(e) => handleRMChange(rm.id, 'reps', e.target.value)}
										/>
									</div>
								</div>

								{rm.calculatedRM && (
									<div className="p-4 bg-lime-400/10 border border-lime-400/30 rounded-lg">
										<div className="flex items-center gap-2 mb-1">
											<Calculator className="w-4 h-4 text-lime-400" />
											<span className="text-sm font-medium text-lime-400">1RM Estimado</span>
										</div>
										<div className="text-2xl font-bold text-lime-400">
											{rm.calculatedRM} kg
										</div>
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor={`notes-${rm.id}`}>Notas (opcional)</Label>
									<Input
										id={`notes-${rm.id}`}
										placeholder=""
										value={rm.notes || ''}
										onChange={(e) => handleRMChange(rm.id, 'notes', e.target.value)}
									/>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Botón para agregar más RMs */}
				<Button
					variant="outline"
					onClick={handleAddRM}
					className="w-full"
				>
					<Plus className="w-4 h-4 mr-2" />
					Agregar otro ejercicio
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
							Guardar RMs
						</>
					)}
				</Button>
			</main>

			<BottomNavigation />
		</div>
	)
}