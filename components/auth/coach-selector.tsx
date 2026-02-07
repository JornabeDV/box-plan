'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Coach {
	id: number
	userId: number
	name: string
	email: string
	image: string | null
	businessName: string | null
	phone: string | null
	address: string | null
	maxStudents: number
	currentStudentCount: number
	availableSlots: number
	hasCapacity: boolean
	hasActiveSubscription: boolean
}

interface CoachSelectorProps {
	userId: number
	onSelect: (coachId: number) => Promise<void>
	onSkip?: () => void
}

export function CoachSelector({ userId, onSelect, onSkip }: CoachSelectorProps) {
	const [coaches, setCoaches] = useState<Coach[]>([])
	const [loading, setLoading] = useState(true)
	const [selecting, setSelecting] = useState<number | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')

	useEffect(() => {
		loadCoaches()
	}, [])

	const loadCoaches = async () => {
		try {
			setLoading(true)
			const response = await fetch('/api/coaches/available')
			const data = await response.json()

			if (data.success) {
				setCoaches(data.coaches || [])
			} else {
				setError('Error al cargar los coaches disponibles')
			}
		} catch (err) {
			console.error('Error loading coaches:', err)
			setError('Error al cargar los coaches disponibles')
		} finally {
			setLoading(false)
		}
	}

	const handleSelectCoach = async (coachId: number) => {
		try {
			setSelecting(coachId)
			setError(null)
			await onSelect(coachId)
		} catch (err: any) {
			setError(err.message || 'Error al seleccionar el coach')
			setSelecting(null)
		}
	}

	const filteredCoaches = coaches.filter(coach => {
		if (!searchQuery) return true
		const query = searchQuery.toLowerCase()
		return coach.name?.toLowerCase().includes(query)
	})

	if (loading) {
		return (
			<Card className="w-full max-w-2xl mx-auto">
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
						<p className="text-muted-foreground">Cargando coaches disponibles...</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl font-bold">Selecciona tu Coach</CardTitle>
				<CardDescription className="text-foreground/70">
					Elige el coach que te acompañará en tu entrenamiento. Puedes cambiar más adelante si lo deseas.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Buscador */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar por nombre..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 text-sm placeholder:text-sm"
					/>
				</div>

				{/* Lista de coaches */}
				{filteredCoaches.length === 0 ? (
					<div className="text-center py-12">
						<Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<p className="text-lg font-semibold mb-2">
							{searchQuery ? 'No se encontraron coaches' : 'No hay coaches disponibles'}
						</p>
						<p className="text-muted-foreground">
							{searchQuery
								? 'Intenta con otro término de búsqueda'
								: 'Por el momento no hay coaches con capacidad disponible. Puedes continuar sin seleccionar un coach.'}
						</p>
						{onSkip && (
							<Button
								variant="outline"
								onClick={onSkip}
								className="mt-4"
							>
								Continuar sin Coach
							</Button>
						)}
					</div>
				) : (
					<div className="space-y-2">
						{filteredCoaches.map((coach) => (
							<Button
								key={coach.id}
								variant="outline"
								onClick={() => handleSelectCoach(coach.id)}
								disabled={selecting !== null}
								className="w-full justify-start h-auto py-3 px-4"
							>
								{selecting === coach.id ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Seleccionando...
									</>
								) : (
									coach.name
								)}
							</Button>
						))}
					</div>
				)}

				{/* Opción para saltar */}
				{onSkip && filteredCoaches.length > 0 && (
					<div className="text-center pt-4 border-t">
						<Button
							variant="ghost"
							onClick={onSkip}
							disabled={selecting !== null}
						>
							Continuar sin seleccionar un coach
						</Button>
						<p className="text-xs text-muted-foreground mt-2">
							Puedes seleccionar un coach más adelante desde tu perfil
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}