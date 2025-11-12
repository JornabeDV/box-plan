'use client'

export function LoadingScreen() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
			<div className="text-center space-y-4">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
				<p className="text-muted-foreground">Cargando dashboard...</p>
			</div>
		</div>
	)
}