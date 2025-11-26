'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuthWithRoles } from '@/hooks/use-auth-with-roles'

interface DashboardHeaderProps {
	businessName?: string | null
}

export function DashboardHeader({ businessName }: DashboardHeaderProps) {
	const { user, signOut } = useAuthWithRoles()

	return (
		<div className="border-b bg-card/50 backdrop-blur-sm">
			<div className="container mx-auto px-4 py-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
							Dashboard Coach
						</h1>
						<p className="text-sm sm:text-base text-muted-foreground">
							{businessName || 'Panel de Control'}
						</p>
					</div>
					{user && (
						<Button
							onClick={() => signOut()}
							variant="ghost"
							size="sm"
							className="flex items-center gap-1.5 md:gap-2 hover:bg-white/5 hover:text-red-400 transition-colors rounded-xl touch-manipulation"
						>
							<LogOut className="w-4 h-4 md:w-5 md:h-5" />
							<span className="hidden sm:inline text-xs md:text-sm font-semibold">Salir</span>
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}