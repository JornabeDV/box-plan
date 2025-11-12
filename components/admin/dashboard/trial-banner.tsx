'use client'

import { Button } from '@/components/ui/button'

interface TrialBannerProps {
	isTrial: boolean
	hasAccess: boolean
	daysRemaining: number
}

export function TrialBanner({ isTrial, hasAccess, daysRemaining }: TrialBannerProps) {
	if (!isTrial || !hasAccess) return null

	return (
		<div className={`border-b ${
			daysRemaining <= 2 
				? 'bg-yellow-500/10 border-yellow-500/20' 
				: 'bg-blue-500/10 border-blue-500/20'
		}`}>
			<div className="container mx-auto px-4 py-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className={`text-sm font-medium ${
							daysRemaining <= 2 
								? 'text-yellow-700 dark:text-yellow-400' 
								: 'text-blue-700 dark:text-blue-400'
						}`}>
							{daysRemaining > 0 
								? `Período de prueba: ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
								: 'Tu período de prueba ha terminado'}
						</span>
					</div>
					{daysRemaining > 0 && (
						<Button
							size="sm"
							onClick={() => window.location.href = '/pricing/coaches'}
							className="hover:scale-100 active:scale-100"
						>
							Seleccionar Plan
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}

