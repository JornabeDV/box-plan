'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, RotateCcw, Clock, Timer, Zap, Target, Repeat, Bell } from 'lucide-react'
import { TimerMode } from '@/hooks/use-timer'

interface TimerDisplayProps {
	mode: TimerMode
	currentRound?: number
	totalRounds?: string
	displayTime: string
	phaseText: string
	phaseColor: string
	isRunning: boolean
	isPaused: boolean
	onStart: () => void
	onPause: () => void
	onReset: () => void
}

const modeIcons = {
	normal: Clock,
	tabata: Zap,
	fortime: Timer,
	amrap: Target,
	emom: Bell,
	otm: Repeat,
}

const modeNames = {
	normal: 'Cronómetro Normal',
	tabata: 'TABATA',
	fortime: 'FOR TIME',
	amrap: 'AMRAP',
	emom: 'EMOM',
	otm: 'OTM',
}

export function TimerDisplay({
	mode,
	currentRound,
	totalRounds,
	displayTime,
	phaseText,
	phaseColor,
	isRunning,
	isPaused,
	onStart,
	onPause,
	onReset,
}: TimerDisplayProps) {
	const Icon = modeIcons[mode]

	return (
		<Card className="max-w-md mx-auto">
			<CardHeader className="text-center">
				<CardTitle className="flex items-center justify-center gap-2">
					<Icon className="w-6 h-6 text-primary" />
					{modeNames[mode]}
				</CardTitle>
			</CardHeader>
			<CardContent className="text-center space-y-6">
				{mode === 'tabata' && currentRound && totalRounds && (
					<div className="text-lg font-medium">
						Ronda {currentRound} de {totalRounds}
					</div>
				)}

				{mode === 'tabata' && (
					<div className={`text-xl font-bold ${phaseColor}`}>
						{phaseText}
					</div>
				)}

				<div className={`text-6xl font-mono font-bold ${phaseColor}`}>
					{displayTime}
				</div>

				<div className="flex flex-col sm:flex-row justify-center gap-4">
					{!isRunning ? (
						<Button
							onClick={onStart}
							size="lg"
							className="bg-primary hover:bg-primary/90 w-full sm:w-auto h-14 sm:h-11 text-base sm:text-sm px-8 sm:px-6"
						>
							<Play className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
							Iniciar
						</Button>
					) : (
						<Button
							onClick={onPause}
							size="lg"
							variant="outline"
							className="w-full sm:w-auto h-14 sm:h-11 text-base sm:text-sm px-8 sm:px-6"
						>
							{isPaused ? (
								<>
									<Play className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
									Continuar
								</>
							) : (
								<>
									<Pause className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
									Pausar
								</>
							)}
						</Button>
					)}

					<Button
						onClick={onReset}
						size="lg"
						variant="outline"
						className="w-full sm:w-auto h-14 sm:h-11 text-base sm:text-sm px-8 sm:px-6"
					>
						<RotateCcw className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
						Reset
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}