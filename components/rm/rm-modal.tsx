'use client'

import { useState, useEffect } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Weight, Plus, X, Loader2, CheckCircle } from 'lucide-react'

interface RMRecord {
	id: string
	exercise: string
	weight: string
}

interface RMModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (rms: Array<{ exercise: string; weight: number; recorded_at: string }>) => Promise<void>
	exerciseNames: string[]
	isEditMode?: boolean
	initialRM?: { id: number; exercise: string; weight: number } | null
	loading?: boolean
}

export function RMModal({
	open,
	onOpenChange,
	onSubmit,
	exerciseNames,
	isEditMode = false,
	initialRM = null,
	loading = false
}: RMModalProps) {
	const [rms, setRms] = useState<RMRecord[]>([
		{ id: '1', exercise: initialRM?.exercise || '', weight: initialRM ? String(initialRM.weight) : '' }
	])

	// Resetear el formulario cuando cambia el initialRM o se abre/cierra el modal
	useEffect(() => {
		if (open) {
			if (isEditMode && initialRM) {
				setRms([{ id: '1', exercise: initialRM.exercise, weight: String(initialRM.weight) }])
			} else {
				setRms([{ id: '1', exercise: '', weight: '' }])
			}
		}
	}, [open, isEditMode, initialRM])

	const handleAddRM = () => {
		setRms([...rms, {
			id: String(Date.now()),
			exercise: '',
			weight: ''
		}])
	}

	const handleRemoveRM = (id: string) => {
		if (rms.length > 1) {
			setRms(rms.filter(rm => rm.id !== id))
		}
	}

	const handleRMChange = (id: string, field: keyof RMRecord, value: string) => {
		setRms(rms.map(rm => {
			if (rm.id === id) {
				return { ...rm, [field]: value }
			}
			return rm
		}))
	}

	const handleSubmit = async () => {
		// Validar que todos los RMs tengan ejercicio y peso
		const invalidRMs = rms.filter(rm => 
			!rm.exercise.trim() || 
			!rm.weight.trim() || 
			parseFloat(rm.weight) <= 0
		)

		if (invalidRMs.length > 0) {
			return
		}

		// Preparar los datos de los RMs
		const rmData = rms.map(rm => ({
			exercise: rm.exercise.trim(),
			weight: parseFloat(rm.weight),
			recorded_at: new Date().toISOString()
		}))

		await onSubmit(rmData)
		// El modal se cierra desde el componente padre después del submit exitoso
	}

	const handleClose = () => {
		setRms([{ id: '1', exercise: '', weight: '' }])
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Weight className="w-5 h-5 text-lime-400" />
						{isEditMode ? 'Editar RM' : 'Registrar Nuevo RM'}
					</DialogTitle>
					<DialogDescription>
						{isEditMode 
							? 'Modifica los datos de tu repetición máxima. El peso que ingreses es el peso máximo que puedes levantar en una sola repetición.'
							: 'Registra tus repeticiones máximas (RM). El peso que ingreses es el peso máximo que puedes levantar en una sola repetición.'
						}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{rms.map((rm, index) => (
						<Card key={rm.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">
										{isEditMode ? 'Ejercicio' : `Ejercicio ${index + 1}`}
									</CardTitle>
									{!isEditMode && rms.length > 1 && (
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
									<Label htmlFor={`modal-exercise-${rm.id}`}>Ejercicio</Label>
									<Select
										value={rm.exercise}
										onValueChange={(value) => handleRMChange(rm.id, 'exercise', value)}
									>
										<SelectTrigger id={`modal-exercise-${rm.id}`} className="w-full">
											<SelectValue placeholder="Selecciona un ejercicio" />
										</SelectTrigger>
										<SelectContent>
											{exerciseNames.length === 0 ? (
												<SelectItem value="" disabled>
													No hay ejercicios disponibles
												</SelectItem>
											) : (
												exerciseNames.map((exerciseName) => (
													<SelectItem key={exerciseName} value={exerciseName}>
														{exerciseName}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor={`modal-weight-${rm.id}`}>Peso RM (kg)</Label>
									<Input
										id={`modal-weight-${rm.id}`}
										type="number"
										min="0"
										step="0.5"
										placeholder="0"
										value={rm.weight}
										onChange={(e) => handleRMChange(rm.id, 'weight', e.target.value)}
									/>
									<p className="text-xs text-muted-foreground">
										Peso máximo que puedes levantar en una sola repetición
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				<DialogFooter className="flex-col sm:flex-row gap-2">
					{!isEditMode && (
						<Button
							variant="outline"
							onClick={handleAddRM}
							className="w-full sm:w-auto"
						>
							<Plus className="w-4 h-4 mr-2" />
							Agregar otro ejercicio
						</Button>
					)}
					<div className="flex gap-2 w-full sm:w-auto">
						<Button
							variant="outline"
							onClick={handleClose}
							disabled={loading}
							className="flex-1 sm:flex-initial"
						>
							Cancelar
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={loading}
							className="flex-1 sm:flex-initial"
						>
							{loading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									{isEditMode ? 'Actualizando...' : 'Guardando...'}
								</>
							) : (
								<>
									<CheckCircle className="w-4 h-4 mr-2" />
									{isEditMode ? 'Actualizar RM' : 'Guardar RM'}
								</>
							)}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}