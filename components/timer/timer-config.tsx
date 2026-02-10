'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TimerMode } from '@/hooks/use-timer'

interface TimerConfigProps {
	mode: TimerMode
	workTime: string
	restTime: string
	totalRounds: string
	amrapTime: string
	isRunning: boolean
	isPaused: boolean
	onWorkTimeChange: (value: string) => void
	onRestTimeChange: (value: string) => void
	onTotalRoundsChange: (value: string) => void
	onAmrapTimeChange: (value: string) => void
}

export function TimerConfig({
	mode,
	workTime,
	restTime,
	totalRounds,
	amrapTime,
	isRunning,
	isPaused,
	onWorkTimeChange,
	onRestTimeChange,
	onTotalRoundsChange,
	onAmrapTimeChange,
}: TimerConfigProps) {
	if (mode === 'tabata') {
		return (
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>Configuración TABATA</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="workTime">Trabajo (seg)</Label>
							<Input
								id="workTime"
								type="number"
								value={workTime}
								onChange={(e) => {
									const value = e.target.value
									if (value === '' || (value.length <= 3 && parseInt(value) <= 999)) {
										onWorkTimeChange(value)
									}
								}}
								min="1"
								max="999"
								placeholder="20"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="restTime">Descanso (seg)</Label>
							<Input
								id="restTime"
								type="number"
								value={restTime}
								onChange={(e) => {
									const value = e.target.value
									if (value === '' || (value.length <= 3 && parseInt(value) <= 999)) {
										onRestTimeChange(value)
									}
								}}
								min="1"
								max="999"
								placeholder="10"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="totalRounds">Rondas</Label>
						<Input
							id="totalRounds"
							type="number"
							value={totalRounds}
							onChange={(e) => {
								const value = e.target.value
								if (value === '' || (value.length <= 2 && parseInt(value) <= 99)) {
									onTotalRoundsChange(value)
								}
							}}
							min="1"
							max="20"
							placeholder="8"
						/>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (mode === 'amrap') {
		return (
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>Configuración AMRAP</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="amrapTime">Tiempo (minutos)</Label>
						<Input
							id="amrapTime"
							type="number"
							value={amrapTime}
							onChange={(e) => {
								const value = e.target.value
								if (value === '' || (value.length <= 3 && parseInt(value) <= 999)) {
									onAmrapTimeChange(value)
								}
							}}
							min="1"
							max="999"
							placeholder="10"
							disabled={isRunning || isPaused}
						/>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (mode === 'emom') {
		return (
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>Configuración EMOM</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="totalRounds">Número de Rondas</Label>
						<Input
							id="totalRounds"
							type="number"
							value={totalRounds}
							onChange={(e) => {
								const value = e.target.value
								if (value === '' || (value.length <= 2 && parseInt(value) <= 99)) {
									onTotalRoundsChange(value)
								}
							}}
							min="1"
							max="99"
							placeholder="10"
							disabled={isRunning || isPaused}
						/>
					</div>
				</CardContent>
			</Card>
		)
	}

	return null
}