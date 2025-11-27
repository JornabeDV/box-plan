'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Loader2, Target, CheckCircle, Lock } from 'lucide-react'
import { useDisciplines, type Discipline, type DisciplineLevel } from '@/hooks/use-disciplines'
import { useCurrentUserPreferences } from '@/hooks/use-current-user-preferences'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PreferenceSelectorProps {
	coachId: number | null
	onPreferencesSaved?: () => void
}

export function PreferenceSelector({ coachId, onPreferencesSaved }: PreferenceSelectorProps) {
	const { toast } = useToast()
	const { disciplines, disciplineLevels, loading: disciplinesLoading } = useDisciplines(
		coachId ? coachId.toString() : null
	)
	const { preferences, loading: preferencesLoading, updatePreferences, lockStatus } = useCurrentUserPreferences()
	
	const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(null)
	const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
	const [saving, setSaving] = useState(false)

	const isLocked = lockStatus?.isLocked ?? false
	const hasChanges = selectedDisciplineId !== preferences?.preferredDisciplineId || 
		selectedLevelId !== preferences?.preferredLevelId

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

	const handleDisciplineSelect = (value: string) => {
		const disciplineId = value === '' ? null : parseInt(value, 10)
		setSelectedDisciplineId(disciplineId)
		// Resetear nivel cuando cambia la disciplina
		setSelectedLevelId(null)
	}

	const handleLevelSelect = (value: string) => {
		const levelId = value === '' ? null : parseInt(value, 10)
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

		if (isLocked && hasChanges) {
			toast({
				title: 'Cambio bloqueado',
				description: lockStatus?.message || 'Ya has cambiado tus preferencias este mes',
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
				{isLocked && lockStatus?.nextChangeDate && (
					<div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border">
						<div className="flex items-start gap-2">
							<Lock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
							<div className="text-sm text-muted-foreground">
								<p className="font-medium mb-1">Cambio bloqueado</p>
								<p>{lockStatus.message}</p>
								<p className="mt-1">
									Podrás cambiar nuevamente el{' '}
									<span className="font-semibold">
										{format(new Date(lockStatus.nextChangeDate), "d 'de' MMMM, yyyy", { locale: es })}
									</span>
								</p>
							</div>
						</div>
					</div>
				)}
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Selección de Disciplina */}
				<div className="space-y-2">
					<Label htmlFor="discipline-select" className="text-sm font-semibold text-foreground">
						Selecciona tu Disciplina
					</Label>
					<Select
						value={selectedDisciplineId?.toString() || ''}
						onValueChange={handleDisciplineSelect}
						disabled={isLocked}
					>
						<SelectTrigger id="discipline-select">
							<SelectValue placeholder="Selecciona una disciplina" />
						</SelectTrigger>
						<SelectContent>
							{disciplines.map((discipline) => (
								<SelectItem key={discipline.id} value={discipline.id}>
									<div className="flex items-center gap-2">
										<div
											className="w-3 h-3 rounded-full border"
											style={{
												backgroundColor: discipline.color,
												borderColor: discipline.color
											}}
										/>
										<span>{discipline.name}</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Selección de Nivel */}
				<div className="space-y-2">
					<Label htmlFor="level-select" className="text-sm font-semibold text-foreground">
						Selecciona tu Nivel
					</Label>
					<Select
						value={selectedLevelId?.toString() || ''}
						onValueChange={handleLevelSelect}
						disabled={isLocked || !selectedDisciplineId || availableLevels.length === 0}
					>
						<SelectTrigger id="level-select">
							<SelectValue placeholder={
								!selectedDisciplineId
									? 'Primero selecciona una disciplina'
									: availableLevels.length === 0
										? 'No hay niveles disponibles'
										: 'Selecciona un nivel'
							} />
						</SelectTrigger>
						<SelectContent>
							{availableLevels.map((level) => (
								<SelectItem key={level.id} value={level.id}>
									{level.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{!selectedDisciplineId && (
						<p className="text-xs text-muted-foreground">
							Selecciona una disciplina para habilitar la selección de nivel
						</p>
					)}
				</div>

				{/* Botón Guardar */}
				<div className="pt-4 border-t border-border">
					<Button
						onClick={handleSave}
						disabled={!selectedDisciplineId || !selectedLevelId || saving || (isLocked && hasChanges)}
						className="w-full"
						size="lg"
					>
						{saving ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Guardando...
							</>
						) : isLocked && hasChanges ? (
							<>
								<Lock className="w-4 h-4 mr-2" />
								Cambio bloqueado
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