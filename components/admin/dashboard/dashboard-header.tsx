'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface DashboardHeaderProps {
	businessName?: string | null
}

export function DashboardHeader({ businessName }: DashboardHeaderProps) {
	return (
		<div className="border-b bg-card/50 backdrop-blur-sm">
			<div className="container mx-auto px-4 py-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button 
							variant="outline"
							size="sm"
							onClick={() => window.location.href = '/'}
							className="flex items-center gap-2"
						>
							<ArrowLeft className="w-4 h-4" />
							<span className="hidden sm:inline">Volver al Inicio</span>
						</Button>
						<div>
							<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
								Dashboard Coach
							</h1>
							<p className="text-sm sm:text-base text-muted-foreground">
								{businessName || 'Panel de Control'}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}