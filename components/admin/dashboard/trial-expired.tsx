'use client'

import { Button } from '@/components/ui/button'
import { DollarSign } from 'lucide-react'

interface TrialExpiredProps {
	trialEndDate?: Date | null
}

export function TrialExpired({ trialEndDate }: TrialExpiredProps) {
	const formattedDate = trialEndDate 
		? new Date(trialEndDate).toLocaleDateString('es-AR', { 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		})
		: null

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
			<div className="text-center space-y-4 max-w-md mx-auto px-4">
				<div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
					<DollarSign className="w-8 h-8 text-yellow-600" />
				</div>
				<h1 className="text-2xl font-bold">Período de Prueba Finalizado</h1>
				<p className="text-muted-foreground">
					{formattedDate 
						? `Tu período de prueba gratuito finalizó el ${formattedDate}. Para continuar usando Box Plan con tus estudiantes, necesitas seleccionar un plan.`
						: 'Tu período de prueba gratuito de 7 días ha terminado. Para continuar usando Box Plan con tus estudiantes, necesitas seleccionar un plan.'
					}
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
					<Button
						onClick={() => window.location.href = '/pricing/coaches'}
						className="hover:scale-100 active:scale-100"
					>
						Ver Planes y Precios
					</Button>
					<Button
						variant="outline"
						onClick={() => window.location.href = '/'}
						className="hover:scale-100 active:scale-100"
					>
						Volver al Inicio
					</Button>
				</div>
			</div>
		</div>
	)
}