'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CoachPlanCard } from '@/components/pricing/coach-plan-card'
import { useSession } from 'next-auth/react'
import { CreditCard, Shield, Zap, Users, TrendingUp, Loader2 } from 'lucide-react'

interface CoachPlan {
	id: number
	name: string
	displayName: string
	minStudents: number
	maxStudents: number
	basePrice: number
	commissionRate: number
	features?: any
}

export default function PricingPage() {
	const router = useRouter()
	const { data: session, status } = useSession()
	const [loading, setLoading] = useState<string | null>(null)
	const [plans, setPlans] = useState<CoachPlan[]>([])
	const [loadingPlans, setLoadingPlans] = useState(true)

	useEffect(() => {
		const fetchPlans = async () => {
			try {
				const response = await fetch('/api/coaches/plans')
				const data = await response.json()
				if (data.success && data.plans) {
					setPlans(data.plans)
				}
			} catch (error) {
				console.error('Error fetching coach plans:', error)
			} finally {
				setLoadingPlans(false)
			}
		}

		fetchPlans()
	}, [])

	const handleSelectPlan = async (planId: number) => {
		// Verificar autenticación antes de proceder
		if (status === 'loading') {
			return
		}

		if (!session?.user) {
			router.push('/login?redirect=/pricing')
			return
		}

		// Verificar que el usuario sea coach
		if (session.user.role !== 'coach') {
			router.push('/register/coach')
			return
		}

		setLoading(planId.toString())
		
		try {
			// TODO: Implementar creación de suscripción de coach
			alert('Funcionalidad de suscripción de coach en desarrollo. Plan seleccionado: ' + planId)
		} catch (error) {
			console.error('Error:', error)
		} finally {
			setLoading(null)
		}
	}

	if (loadingPlans) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="flex items-center gap-2">
					<Loader2 className="w-6 h-6 animate-spin" />
					<span>Cargando planes...</span>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="bg-gradient-to-r from-primary/5 to-accent/5 py-6">
				<div className="container mx-auto px-4 text-center">
					<h1 className="text-2xl md:text-3xl font-bold mb-2">
						Planes para Coaches
					</h1>
					<p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
						Elige el plan que mejor se adapte a tu negocio. Gestiona tus estudiantes y gana comisiones por cada suscripción.
					</p>
				</div>
			</div>

			{/* Planes */}
			<div className="container mx-auto px-4 py-16">
				{plans.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-muted-foreground">
							No hay planes disponibles en este momento. Por favor, contacta al administrador.
						</p>
					</div>
				) : (
							<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
								{plans.map((plan) => (
									<CoachPlanCard
										key={plan.id}
										plan={plan}
										onSelect={handleSelectPlan}
										loading={loading === plan.id.toString()}
										currentPlan={false}
										isAuthenticated={!!session?.user}
										onRedirectToLogin={() => router.push('/login?redirect=/pricing/coaches')}
									/>
								))}
							</div>
				)}
			</div>

			{/* Características adicionales */}
			<div className="bg-muted/50 py-16">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold mb-4">
							¿Por qué elegir Box Plan como Coach?
						</h2>
						<p className="text-lg text-muted-foreground">
							Herramientas profesionales para gestionar tu negocio
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
						<div className="text-center">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Users className="w-8 h-8 text-blue-600" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Gestiona tus Estudiantes</h3>
							<p className="text-muted-foreground">
								Administra todos tus estudiantes desde un solo lugar
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<TrendingUp className="w-8 h-8 text-purple-600" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Gana Comisiones</h3>
							<p className="text-muted-foreground">
								Recibe comisiones por cada estudiante que se suscribe
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Shield className="w-8 h-8 text-green-600" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Seguro y Confiable</h3>
							<p className="text-muted-foreground">
								Tus datos y los de tus estudiantes están protegidos
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* FAQ */}
			<div className="py-16">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold mb-4">
							Preguntas Frecuentes
						</h2>
					</div>

					<div className="max-w-3xl mx-auto space-y-6">
						<div className="bg-card p-6 rounded-lg">
							<h3 className="text-lg font-semibold mb-2">
								¿Cómo funcionan las comisiones?
							</h3>
							<p className="text-muted-foreground">
								Recibes un porcentaje de comisión por cada estudiante que se suscribe a través de tu cuenta. El porcentaje varía según tu plan.
							</p>
						</div>

						<div className="bg-card p-6 rounded-lg">
							<h3 className="text-lg font-semibold mb-2">
								¿Puedo cambiar de plan en cualquier momento?
							</h3>
							<p className="text-muted-foreground">
								Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplicarán en tu próximo ciclo de facturación.
							</p>
						</div>

						<div className="bg-card p-6 rounded-lg">
							<h3 className="text-lg font-semibold mb-2">
								¿Qué métodos de pago aceptan?
							</h3>
							<p className="text-muted-foreground">
								Aceptamos todas las tarjetas de crédito y débito, transferencias bancarias y billeteras digitales a través de MercadoPago.
							</p>
						</div>

						<div className="bg-card p-6 rounded-lg">
							<h3 className="text-lg font-semibold mb-2">
								¿Cómo agrego estudiantes a mi cuenta?
							</h3>
							<p className="text-muted-foreground">
								Puedes invitar estudiantes por email o compartir un enlace de invitación. Una vez que se registren y se suscriban, estarán vinculados a tu cuenta.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}