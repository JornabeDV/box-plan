'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Lock, Unlock, Calendar as CalendarIcon, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMonthPlanifications } from '@/hooks/use-month-planifications'
import { useToast } from '@/hooks/use-toast'
import { useDisciplines } from '@/hooks/use-disciplines'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'

interface TrialCalendarProps {
	onDateClick?: (date: Date) => void
	coachId?: number | null
}

/**
 * Componente TrialCalendar - Calendario para usuarios sin suscripción
 * Muestra el calendario completo pero solo permite acceso al primer día con planificación
 * Los demás días redirigen a /pricing
 */
export function TrialCalendar({ onDateClick, coachId }: TrialCalendarProps) {
	const router = useRouter()
	const { toast } = useToast()
	const [currentDate, setCurrentDate] = useState(new Date())
	const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(null)

	const today = new Date()
	const year = currentDate.getFullYear()
	const month = currentDate.getMonth() + 1 // 1-12

	// Obtener disciplinas del coach
	const { disciplines, loading: disciplinesLoading, fetchDisciplines } = useDisciplines(
		coachId ? coachId.toString() : null
	)

	// Cargar disciplinas cuando cambie el coachId
	useEffect(() => {
		if (coachId) {
			fetchDisciplines()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [coachId])

	// Seleccionar automáticamente la primera disciplina cuando se carguen las disciplinas
	useEffect(() => {
		if (disciplines.length > 0 && selectedDisciplineId === null) {
			setSelectedDisciplineId(parseInt(disciplines[0].id, 10))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [disciplines])

	// Obtener planificaciones del mes, filtradas por disciplina si está seleccionada
	const { datesWithPlanification, firstAvailableDay, loading } = useMonthPlanifications(
		year,
		month,
		selectedDisciplineId
	)

	// Si no hay disciplinas, no mostrar el calendario
	if (!coachId) {
		return null
	}

	if (disciplinesLoading) {
		return (
			<Card className="bg-card/80 backdrop-blur-sm border-2 border-border shadow-soft">
				<CardContent className="py-12">
					<div className="flex items-center justify-center">
						<div className="text-muted-foreground">Cargando calendario...</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (disciplines.length === 0) {
		return (
			<Card className="bg-card/80 backdrop-blur-sm border-2 border-border shadow-soft">
				<CardHeader>
					<CardTitle className="text-xl font-heading text-foreground flex items-center justify-center gap-2">
						<CalendarIcon className="w-5 h-5" />
						Calendario de Entrenamientos
					</CardTitle>
				</CardHeader>
				<CardContent className="py-12">
					<div className="flex flex-col items-center justify-center gap-3 text-center">
						<p className="text-muted-foreground">
							Tu coach aún no ha configurado disciplinas de entrenamiento.
						</p>
						<p className="text-sm text-muted-foreground">
							Una vez que tu coach agregue disciplinas y planificaciones, podrás verlas aquí.
						</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	// Calcular días del mes
	const firstDay = new Date(year, month - 1, 1)
	const lastDay = new Date(year, month, 0)
	const daysInMonth = lastDay.getDate()
	const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Lunes = 0

	const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
	const monthNames = [
		'Enero',
		'Febrero',
		'Marzo',
		'Abril',
		'Mayo',
		'Junio',
		'Julio',
		'Agosto',
		'Septiembre',
		'Octubre',
		'Noviembre',
		'Diciembre'
	]

	const goToPreviousMonth = () => {
		setCurrentDate(new Date(year, month - 2, 1))
	}

	const goToNextMonth = () => {
		setCurrentDate(new Date(year, month, 1))
	}

	const goToToday = () => {
		setCurrentDate(new Date())
	}

	const hasWorkout = (day: number) => {
		return datesWithPlanification.includes(day)
	}

	const isToday = (day: number) => {
		const date = new Date(year, month - 1, day)
		return date.toDateString() === today.toDateString()
	}

	const isFirstAvailableDay = (day: number) => {
		return firstAvailableDay !== null && day === firstAvailableDay
	}

	const isBlocked = (day: number) => {
		return hasWorkout(day) && !isFirstAvailableDay(day)
	}

	const handleDayClick = (day: number) => {
		const date = new Date(year, month - 1, day)

		// Si es el primer día disponible, permitir acceso completo
		if (isFirstAvailableDay(day)) {
			if (onDateClick) {
				onDateClick(date)
			}
			return
		}

		// Si tiene planificación pero está bloqueado, redirigir a pricing
		if (isBlocked(day)) {
			toast({
				title: 'Suscríbete para acceder',
				description: 'Suscríbete para acceder a todos tus entrenamientos personalizados.',
				variant: 'default'
			})
			router.push('/pricing')
			return
		}

		// Si no tiene planificación, no hacer nada
	}

	// Generar array de días
	const days = []
	for (let i = 0; i < startingDayOfWeek; i++) {
		days.push(null)
	}
	for (let day = 1; day <= daysInMonth; day++) {
		days.push(day)
	}

	return (
		<Card className="bg-card/80 backdrop-blur-sm border-2 border-border shadow-soft">
			<CardHeader className="pb-4">
				<div className="text-center mb-4">
					<CardTitle className="text-xl font-heading text-foreground flex items-center justify-center gap-2">
						<CalendarIcon className="w-5 h-5" />
						Calendario de Entrenamientos
					</CardTitle>
					<p className="text-sm text-muted-foreground mt-2">
						Prueba tu entrenamiento hoy. Suscríbete para acceder a todo el mes.
					</p>
				</div>

				{/* Dropdown de filtro por disciplina */}
				<div className="mb-4 flex items-center justify-center gap-2">
					<Filter className="w-4 h-4 text-muted-foreground" />
					<Select
						value={selectedDisciplineId?.toString() || ''}
						onValueChange={(value) => {
							setSelectedDisciplineId(parseInt(value, 10))
						}}
					>
						<SelectTrigger className="w-full max-w-xs">
							<SelectValue placeholder="Seleccionar disciplina" />
						</SelectTrigger>
						<SelectContent>
							{disciplines.map((discipline) => (
								<SelectItem key={discipline.id} value={discipline.id}>
									<div className="flex items-center gap-2">
										<div
											className="w-3 h-3 rounded-full"
											style={{ backgroundColor: discipline.color }}
										/>
										<span>{discipline.name}</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Navegación del mes */}
				<div className="flex items-center justify-between">
					<Button
						variant="ghost"
						size="icon"
						onClick={goToPreviousMonth}
						className="hover:bg-primary/10 hover:text-primary"
					>
						<ChevronLeft className="w-4 h-4" />
					</Button>

					<h3 className="text-2xl font-heading font-bold text-foreground">
						{monthNames[month - 1]} {year}
					</h3>

					<Button
						variant="ghost"
						size="icon"
						onClick={goToNextMonth}
						className="hover:bg-primary/10 hover:text-primary"
					>
						<ChevronRight className="w-4 h-4" />
					</Button>
				</div>

				{/* Botón Hoy */}
				<div className="flex justify-center mt-4">
					<Button
						variant="outline"
						size="sm"
						onClick={goToToday}
						className="text-sm font-semibold hover:bg-primary/10 hover:text-primary"
					>
						Ir a Hoy
					</Button>
				</div>
			</CardHeader>

			<CardContent className="pt-0">
				{loading ? (
					<div className="flex items-center justify-center py-12">
						<div className="text-muted-foreground">Cargando calendario...</div>
					</div>
				) : (
					<>
						{/* Días de la semana */}
						<div className="grid grid-cols-7 gap-2 mb-4">
							{weekDays.map((day) => (
								<div
									key={day}
									className="text-center text-sm font-bold text-muted-foreground py-2"
								>
									{day}
								</div>
							))}
						</div>

						{/* Días del mes */}
						<div className="grid grid-cols-7 gap-2">
							{days.map((day, index) => {
								if (day === null) {
									return <div key={`empty-${index}`} className="aspect-square" />
								}

								const hasWorkoutValue = hasWorkout(day)
								const isCurrentDay = isToday(day)
								const isFirstDay = isFirstAvailableDay(day)
								const isBlockedDay = isBlocked(day)

								return (
									<div key={`day-${day}-${month}-${year}`} className="aspect-square">
										<div
											className={`
                        w-full h-full flex flex-col items-center justify-center text-sm font-semibold rounded-xl transition-all duration-200 relative
                        ${isFirstDay
													? 'bg-primary text-primary-foreground shadow-lg border-2 border-primary hover:scale-105 cursor-pointer'
													: isBlockedDay
														? 'bg-muted/30 text-muted-foreground border-2 border-muted/50 hover:bg-muted/40 cursor-pointer opacity-60'
														: hasWorkoutValue
															? 'bg-accent/10 text-accent border border-accent/20 opacity-50'
															: isCurrentDay
																? 'bg-primary/20 text-primary-foreground border border-primary/30'
																: 'text-muted-foreground hover:bg-muted/20'
														}
                        ${isFirstDay || isBlockedDay ? 'cursor-pointer' : 'cursor-default'}
                      `}
											onClick={() => handleDayClick(day)}
										>
											<span className="text-sm font-semibold">{day}</span>
											{isFirstDay && (
												<Badge
													variant="secondary"
													className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-green-500 text-white border-0"
												>
													<Unlock className="w-2.5 h-2.5" />
												</Badge>
											)}
											{isBlockedDay && (
												<Badge
													variant="secondary"
													className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-muted text-muted-foreground border-0"
												>
													<Lock className="w-2.5 h-2.5" />
												</Badge>
											)}
										</div>
									</div>
								)
							})}
						</div>

						{/* Leyenda */}
						<div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border flex-wrap">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-primary rounded-full border-2 border-primary"></div>
								<span className="text-xs text-muted-foreground">Día disponible</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-muted/30 border-2 border-muted/50 rounded-full"></div>
								<span className="text-xs text-muted-foreground">Bloqueado</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-accent/10 border border-accent/20 rounded-full"></div>
								<span className="text-xs text-muted-foreground">Con entrenamiento</span>
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}