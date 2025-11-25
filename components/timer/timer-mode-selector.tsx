'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Timer, Zap, Target, Repeat, Bell } from 'lucide-react'
import { TimerMode } from '@/hooks/use-timer'

interface TimerModeSelectorProps {
	mode: TimerMode
	onModeChange: (mode: TimerMode) => void
}

const modeConfigs = {
	normal: { name: 'Cronómetro Normal', icon: Clock, description: 'Cronómetro básico' },
	tabata: { name: 'TABATA', icon: Zap, description: '20s trabajo / 10s descanso' },
	fortime: { name: 'FOR TIME', icon: Timer, description: 'Completar en el menor tiempo' },
	amrap: { name: 'AMRAP', icon: Target, description: 'Máximas rondas posibles' },
	emom: { name: 'EMOM', icon: Bell, description: 'Cada minuto en el minuto' },
	otm: { name: 'OTM', icon: Repeat, description: 'Cada minuto en el minuto' },
}

export function TimerModeSelector({ mode, onModeChange }: TimerModeSelectorProps) {
	return (
		<Card className="max-w-md mx-auto">
			<CardHeader>
				<CardTitle>Tipo de Timer</CardTitle>
			</CardHeader>
			<CardContent>
				<Select value={mode} onValueChange={onModeChange}>
					<SelectTrigger className="h-12 text-base w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(modeConfigs).map(([key, config]) => (
							<SelectItem key={key} value={key}>
								<div className="flex items-center gap-2">
									<config.icon className="w-5 h-5" />
									<span className="text-base">{config.name}</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="text-sm text-muted-foreground mt-2">
					{modeConfigs[mode].description}
				</p>
			</CardContent>
		</Card>
	)
}