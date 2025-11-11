'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CoachSignUpForm } from '@/components/auth/coach-signup-form'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

/**
 * Página de Registro para Coaches
 */
export default function CoachRegisterPage() {
	const [loading, setLoading] = useState(true)
	const router = useRouter()
	const { user, loading: authLoading } = useAuth()

	// Redirigir si el usuario ya está autenticado
	useEffect(() => {
		if (!authLoading && user) {
			// Si ya es coach, redirigir a dashboard
			if (user.role === 'coach') {
				router.push('/coach/dashboard')
			} else {
				// Si es otro tipo de usuario, redirigir a home
				router.push('/')
			}
		}
		setLoading(false)
	}, [user, authLoading, router])

	const handleSuccess = () => {
		router.push('/pricing/coaches')
	}

	const switchToLogin = () => {
		router.push('/login')
	}

	if (loading || authLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
				<div className="flex items-center gap-2">
					<Loader2 className="w-6 h-6 animate-spin" />
					<span>Cargando...</span>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
			{/* Header */}
			<header className="relative overflow-hidden bg-gradient-to-r from-card via-card/95 to-primary/10 border-b border-primary/20 backdrop-blur-sm">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
				<div className="relative flex items-center justify-center p-6">
					<div className="flex items-center gap-4">
						<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
							Box Plan - Para Coaches
						</h1>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
				<div className="w-full max-w-md space-y-6">
					<CoachSignUpForm 
						onSuccess={handleSuccess}
						onSwitchToLogin={switchToLogin}
					/>
				</div>
			</main>
		</div>
	)
}