'use client'

import { Settings } from 'lucide-react'

interface AccessRestrictedProps {
	userEmail?: string | null
	userRole?: string | null
	businessName?: string | null
	authLoading?: boolean
}

export function AccessRestricted({ 
	userEmail, 
	userRole, 
	businessName, 
	authLoading 
}: AccessRestrictedProps) {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
			<div className="text-center space-y-4">
				<div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
					<Settings className="w-8 h-8 text-destructive" />
				</div>
				<h1 className="text-2xl font-bold">Acceso Restringido</h1>
				<p className="text-muted-foreground">
					Solo los coaches pueden acceder a este dashboard.
				</p>
				{process.env.NODE_ENV === 'development' && (
					<div className="mt-4 p-4 bg-muted/50 rounded-lg text-left text-sm">
						<p><strong>Debug Info:</strong></p>
						<p>Usuario: {userEmail || 'No autenticado'}</p>
						<p>Rol: {userRole || 'No asignado'}</p>
						<p>Coach Profile: {businessName || 'No encontrado'}</p>
						<p>Loading: {authLoading ? 'Sí' : 'No'}</p>
					</div>
				)}
			</div>
		</div>
	)
}