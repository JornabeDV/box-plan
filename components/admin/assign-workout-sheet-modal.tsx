'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, X, Calendar } from 'lucide-react'
import { useAdminWorkoutSheets, WorkoutSheet } from '@/hooks/use-admin-workout-sheets'

interface AssignWorkoutSheetModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	userId: string
	userName: string
	adminId: string | null
	onAssignmentComplete?: () => void
}

export function AssignWorkoutSheetModal({
	open,
	onOpenChange,
	userId,
	userName,
	adminId,
	onAssignmentComplete
}: AssignWorkoutSheetModalProps) {
	const { workoutSheets, loading: sheetsLoading } = useAdminWorkoutSheets(adminId)
	
	const [loading, setLoading] = useState(false)
	const [selectedSheetId, setSelectedSheetId] = useState<string>('')
	const [dueDate, setDueDate] = useState<string>('')
	const [adminFeedback, setAdminFeedback] = useState<string>('')
	const [error, setError] = useState<string | null>(null)

	// Filtrar solo planillas activas
	const availableSheets = workoutSheets.filter(sheet => sheet.is_active)

	// Resetear formulario cuando se abre/cierra el modal
	useEffect(() => {
		if (open) {
			setSelectedSheetId('')
			setDueDate('')
			setAdminFeedback('')
			setError(null)
		}
	}, [open])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!selectedSheetId) {
			setError('Por favor selecciona una planilla')
			return
		}

		setLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/admin/workout-sheets/assignments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					user_id: userId,
					sheet_id: selectedSheetId,
					due_date: dueDate ? new Date(dueDate).toISOString() : null,
					admin_feedback: adminFeedback || null
				})
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Error al asignar planilla')
			}

			// Cerrar modal y notificar
			onOpenChange(false)
			if (onAssignmentComplete) {
				onAssignmentComplete()
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al asignar planilla')
		} finally {
			setLoading(false)
		}
	}

	const selectedSheet = availableSheets.find(sheet => sheet.id === selectedSheetId)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileText className="w-5 h-5" />
						Asignar Planilla a {userName}
					</DialogTitle>
					<DialogDescription>
						Selecciona una planilla de entrenamiento para asignar a este usuario
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
							{error}
						</div>
					)}

					{/* Selección de planilla */}
					<div className="space-y-2">
						<Label htmlFor="sheet">Planilla de Entrenamiento *</Label>
						{sheetsLoading ? (
							<div className="flex items-center justify-center py-4">
								<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
							</div>
						) : (
							<Select
								value={selectedSheetId}
								onValueChange={setSelectedSheetId}
								required
							>
								<SelectTrigger id="sheet">
									<SelectValue placeholder="Seleccionar planilla" />
								</SelectTrigger>
								<SelectContent>
									{availableSheets.length === 0 ? (
										<SelectItem value="none" disabled>
											No hay planillas disponibles
										</SelectItem>
									) : (
										availableSheets.map((sheet) => (
											<SelectItem key={sheet.id} value={sheet.id}>
												<div className="flex items-center gap-2">
													<span>{sheet.title}</span>
													{sheet.difficulty && (
														<Badge variant="outline" className="text-xs">
															{sheet.difficulty}
														</Badge>
													)}
												</div>
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						)}
					</div>

					{/* Información de la planilla seleccionada */}
					{selectedSheet && (
						<div className="p-3 bg-muted/50 rounded-md space-y-1">
							<p className="text-sm font-medium">{selectedSheet.title}</p>
							{selectedSheet.description && (
								<p className="text-xs text-muted-foreground">
									{selectedSheet.description}
								</p>
							)}
							<div className="flex gap-2 flex-wrap mt-2">
								{selectedSheet.difficulty && (
									<Badge variant="secondary" className="text-xs">
										{selectedSheet.difficulty}
									</Badge>
								)}
								{selectedSheet.estimated_duration && (
									<Badge variant="outline" className="text-xs">
										{selectedSheet.estimated_duration} min
									</Badge>
								)}
								{selectedSheet.category && (
									<Badge variant="outline" className="text-xs">
										{selectedSheet.category.name}
									</Badge>
								)}
							</div>
						</div>
					)}

					{/* Fecha de vencimiento */}
					<div className="space-y-2">
						<Label htmlFor="dueDate" className="flex items-center gap-2">
							<Calendar className="w-4 h-4" />
							Fecha de Vencimiento (Opcional)
						</Label>
						<Input
							id="dueDate"
							type="date"
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							min={new Date().toISOString().split('T')[0]}
						/>
					</div>

					{/* Feedback del admin */}
					<div className="space-y-2">
						<Label htmlFor="feedback">Notas/Feedback del Admin (Opcional)</Label>
						<Textarea
							id="feedback"
							value={adminFeedback}
							onChange={(e) => setAdminFeedback(e.target.value)}
							placeholder="Agrega notas o instrucciones para el usuario..."
							rows={3}
						/>
					</div>

					{/* Botones */}
					<div className="flex justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loading}
						>
							<X className="w-4 h-4 mr-2" />
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={loading || !selectedSheetId || sheetsLoading}
						>
							{loading ? (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							) : (
								<FileText className="w-4 h-4 mr-2" />
							)}
							Asignar Planilla
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}