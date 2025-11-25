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
import { Weight, Loader2 } from 'lucide-react'

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
	const [rm, setRm] = useState<RMRecord>({
		id: '1',
		exercise: initialRM?.exercise || '',
		weight: initialRM ? String(initialRM.weight) : ''
	})

	// Resetear el formulario cuando cambia el initialRM o se abre/cierra el modal
	useEffect(() => {
		if (open) {
			if (isEditMode && initialRM) {
				setRm({ id: '1', exercise: initialRM.exercise, weight: String(initialRM.weight) })
			} else {
				setRm({ id: '1', exercise: '', weight: '' })
			}
		}
	}, [open, isEditMode, initialRM])

	const handleRMChange = (field: keyof RMRecord, value: string) => {
		setRm({ ...rm, [field]: value })
	}

	const handleSubmit = async () => {
		// Validar que el RM tenga ejercicio y peso
		if (!rm.exercise.trim() || !rm.weight.trim() || parseFloat(rm.weight) <= 0) {
			return
		}

		// Preparar los datos del RM
		const rmData = [{
			exercise: rm.exercise.trim(),
			weight: parseFloat(rm.weight),
			recorded_at: new Date().toISOString()
		}]

		await onSubmit(rmData)
		// El modal se cierra desde el componente padre después del submit exitoso
	}

	const handleClose = () => {
		setRm({ id: '1', exercise: '', weight: '' })
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
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Ejercicio</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="modal-exercise">Ejercicio</Label>
								<Select
									value={rm.exercise}
									onValueChange={(value) => handleRMChange('exercise', value)}
								>
									<SelectTrigger id="modal-exercise" className="w-full">
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
								<Label htmlFor="modal-weight">Peso RM (kg)</Label>
								<Input
									id="modal-weight"
									type="number"
									min="0"
									step="0.5"
									placeholder="0"
									value={rm.weight}
									onChange={(e) => handleRMChange('weight', e.target.value)}
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				<DialogFooter className="gap-2">
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={loading}
						size="sm"
					>
						Cancelar
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={loading}
						size="sm"
					>
						{loading ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								{isEditMode ? 'Actualizando...' : 'Guardando...'}
							</>
						) : (
							<>
								{isEditMode ? 'Actualizar RM' : 'Guardar RM'}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}