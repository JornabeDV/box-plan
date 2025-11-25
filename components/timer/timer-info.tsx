'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimerMode } from '@/hooks/use-timer'

interface TimerInfoProps {
	mode: TimerMode
}

export function TimerInfo({ mode }: TimerInfoProps) {
	const getInfoContent = () => {
		switch (mode) {
			case 'normal':
				return (
					<>
						<p>• Cronómetro básico para medir tiempo</p>
						<p>• Ideal para entrenamientos con tiempo límite</p>
						<p>• Pausa y reanuda cuando necesites</p>
					</>
				)
			case 'tabata':
				return (
					<>
						<p>• 20 segundos de trabajo intenso</p>
						<p>• 10 segundos de descanso</p>
						<p>• 8 rondas completas</p>
						<p>• Total: 4 minutos de entrenamiento</p>
					</>
				)
			case 'fortime':
				return (
					<>
						<p>• Completa el entrenamiento en el menor tiempo</p>
						<p>• Cronómetro cuenta hacia arriba</p>
						<p>• Registra tu mejor tiempo</p>
					</>
				)
			case 'amrap':
				return (
					<>
						<p>• Máximas rondas posibles en el tiempo dado</p>
						<p>• Cronómetro cuenta regresiva desde el tiempo configurado</p>
						<p>• Intensidad máxima</p>
					</>
				)
			case 'emom':
				return (
					<>
						<p>• Si terminas las repeticiones antes de que termine el minuto, descansas lo que quede de ese minuto</p>
						<p>• Al iniciar el siguiente minuto, empiezas la siguiente ronda</p>
						<p>• Ayuda a mantener un ritmo constante y trabajar resistencia y técnica</p>
					</>
				)
			case 'otm':
				return (
					<>
						<p>• Haces la serie, luego descansas lo que necesites antes de empezar la siguiente dentro del mismo minuto</p>
					</>
				)
			default:
				return null
		}
	}

	return (
		<Card className="max-w-md mx-auto">
			<CardHeader>
				<CardTitle>Información del Modo</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm text-muted-foreground">
				{getInfoContent()}
			</CardContent>
		</Card>
	)
}