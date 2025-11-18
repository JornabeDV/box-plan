'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Target, CheckCircle } from 'lucide-react'
import { useDisciplines, type Discipline, type DisciplineLevel } from '@/hooks/use-disciplines'
import { useCurrentUserPreferences } from '@/hooks/use-current-user-preferences'
import { useToast } from '@/hooks/use-toast'

interface PreferenceSelectorProps {
	coachId: number | null
	onPreferencesSaved?: () => void
}

export function PreferenceSelector({ coachId, onPreferencesSaved }: PreferenceSelectorProps) {
	const { toast } = useToast()
	const { disciplines, disciplineLevels, loading: disciplinesLoading } = useDisciplines(
		coachId ? coachId.toString() : null
	)
	const { preferences, loading: preferencesLoading, updatePreferences } = useCurrentUserPreferences()
	
	const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(null)
	const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
	const [saving, setSaving] = useState(false)

	// Cargar preferencias existentes cuando se carguen
	useEffect(() => {
		if (preferences && !preferencesLoading) {
			setSelectedDisciplineId(preferences.preferredDisciplineId)
			setSelectedLevelId(preferences.preferredLevelId)
		}
	}, [preferences, preferencesLoading])

	// Obtener niveles filtrados por disciplina seleccionada
	const availableLevels = selectedDisciplineId
		? disciplineLevels.filter(level => level.discipline_id === selectedDisciplineId.toString())
		: []

	const handleDisciplineSelect = (disciplineId: number) => {
		setSelectedDisciplineId(disciplineId)
		// Resetear nivel cuando cambia la disciplina
		setSelectedLevelId(null)
	}

	const handleLevelSelect = (levelId: number) => {
		setSelectedLevelId(levelId)
	}

	const handleSave = async () => {
		if (!selectedDisciplineId || !selectedLevelId) {
			toast({
				title: 'Selección incompleta',
				description: 'Por favor, selecciona una disciplina y un nivel',
				variant: 'destructive'
			})
			return
		}

		setSaving(true)
		const result = await updatePreferences(selectedDisciplineId, selectedLevelId)

		if (result.error) {
			toast({
				title: 'Error',
				description: result.error,
				variant: 'destructive'
			})
		} else {
			toast({
				title: '¡Preferencias guardadas!',
				description: 'Tus preferencias han sido guardadas correctamente',
				variant: 'default'
			})
			if (onPreferencesSaved) {
				onPreferencesSaved()
			}
		}

		setSaving(false)
	}

	if (disciplinesLoading || preferencesLoading) {
		return (
			<Card className="bg-card/80 backdrop-blur-sm border-2 border-border shadow-soft">
				<CardContent className="py-12">
					<div className="flex items-center justify-center gap-2">
						<Loader2 className="w-5 h-5 animate-spin text-primary" />
						<span className="text-muted-foreground">Cargando opciones...</span>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (disciplines.length === 0) {
		return (
			<Card className="bg-card/80 backdrop-blur-sm border-2 border-border shadow-soft">
				<CardHeader>
					<CardTitle className="text-xl font-heading text-foreground flex items-center gap-2">
						<Target className="w-5 h-5" />
						Configura tus Preferencias
					</CardTitle>
					<CardDescription>
						Tu coach aún no ha configurado disciplinas disponibles
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-soft">
			<CardHeader>
				<CardTitle className="text-xl font-heading text-foreground flex items-center gap-2">
					<Target className="w-5 h-5 text-primary" />
					Configura tus Preferencias
				</CardTitle>
				<CardDescription>
					Selecciona tu disciplina y nivel para ver tus entrenamientos personalizados
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Selección de Disciplina */}
				<div className="space-y-3">
					<label className="text-sm font-semibold text-foreground">
						Selecciona tu Disciplina
					</label>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{disciplines.map((discipline) => (
							<button
								key={discipline.id}
								type="button"
								onClick={() => handleDisciplineSelect(parseInt(discipline.id, 10))}
								className={`
									relative p-4 rounded-lg border-2 transition-all duration-200
									text-left hover:scale-105
									${selectedDisciplineId === parseInt(discipline.id, 10)
										? 'border-primary bg-primary/10 shadow-md'
										: 'border-border bg-card hover:border-primary/50'
									}
								`}
							>
								<div className="flex items-center gap-3">
									<div
										className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
										style={{
											backgroundColor: selectedDisciplineId === parseInt(discipline.id, 10)
												? discipline.color
												: 'transparent',
											borderColor: discipline.color
										}}
									>
										{selectedDisciplineId === parseInt(discipline.id, 10) && (
											<CheckCircle className="w-3 h-3 text-white" />
										)}
									</div>
									<div className="flex-1">
										<div className="font-semibold text-foreground">{discipline.name}</div>
										{discipline.description && (
											<div className="text-xs text-muted-foreground mt-1">
												{discipline.description}
											</div>
										)}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Selección de Nivel */}
				{selectedDisciplineId && (
					<div className="space-y-3">
						<label className="text-sm font-semibold text-foreground">
							Selecciona tu Nivel
						</label>
						{availableLevels.length === 0 ? (
							<div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
								<p className="text-sm text-muted-foreground">
									No hay niveles disponibles para esta disciplina
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{availableLevels.map((level) => (
									<button
										key={level.id}
										type="button"
										onClick={() => handleLevelSelect(parseInt(level.id, 10))}
										className={`
											relative p-4 rounded-lg border-2 transition-all duration-200
											text-left hover:scale-105
											${selectedLevelId === parseInt(level.id, 10)
												? 'border-primary bg-primary/10 shadow-md'
												: 'border-border bg-card hover:border-primary/50'
											}
										`}
									>
										<div className="flex items-center gap-3">
											<div
												className={`
													w-4 h-4 rounded-full border-2 flex items-center justify-center
													${selectedLevelId === parseInt(level.id, 10)
														? 'bg-primary border-primary'
														: 'border-border'
													}
												`}
											>
												{selectedLevelId === parseInt(level.id, 10) && (
													<CheckCircle className="w-3 h-3 text-white" />
												)}
											</div>
											<div className="flex-1">
												<div className="font-semibold text-foreground">{level.name}</div>
												{level.description && (
													<div className="text-xs text-muted-foreground mt-1">
														{level.description}
													</div>
												)}
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				)}

				{/* Botón Guardar */}
				<div className="pt-4 border-t border-border">
					<Button
						onClick={handleSave}
						disabled={!selectedDisciplineId || !selectedLevelId || saving}
						className="w-full"
						size="lg"
					>
						{saving ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Guardando...
							</>
						) : (
							<>
								<CheckCircle className="w-4 h-4 mr-2" />
								Guardar Preferencias
							</>
						)}
					</Button>
					{selectedDisciplineId && !selectedLevelId && (
						<p className="text-xs text-muted-foreground mt-2 text-center">
							Por favor, selecciona un nivel para continuar
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	)
}