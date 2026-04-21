'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CoachSignUpForm } from '@/components/auth/coach-signup-form'
import { AuthLayout } from '@/components/auth/auth-layout'
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
			<div className="min-h-screen flex items-center justify-center">
				<div className="flex items-center gap-2">
					<Loader2 className="w-6 h-6 animate-spin text-primary" />
					<span className="text-muted-foreground">Cargando...</span>
				</div>
			</div>
		)
	}

	return (
		<AuthLayout title="Registro Coach" subtitle="Para Coaches">
			<CoachSignUpForm 
				onSuccess={handleSuccess}
				onSwitchToLogin={switchToLogin}
			/>
		</AuthLayout>
	)
}
