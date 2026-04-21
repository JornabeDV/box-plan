'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CoachSignUpFormProps {
	onSuccess?: () => void
	onSwitchToLogin?: () => void
}

export function CoachSignUpForm({ onSuccess, onSwitchToLogin }: CoachSignUpFormProps) {
	const router = useRouter()
	const [formData, setFormData] = useState({
		fullName: '',
		email: '',
		password: '',
		confirmPassword: '',
		businessName: '',
		phone: '',
		address: ''
	})
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [success, setSuccess] = useState(false)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData(prev => ({
			...prev,
			[e.target.name]: e.target.value
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setLoading(true)

		if (formData.password !== formData.confirmPassword) {
			setError('Las contraseñas no coinciden')
			setLoading(false)
			return
		}

		if (formData.password.length < 6) {
			setError('La contraseña debe tener al menos 6 caracteres')
			setLoading(false)
			return
		}

		try {
			const response = await fetch('/api/coaches/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: formData.email,
					password: formData.password,
					name: formData.fullName,
					businessName: formData.businessName || undefined,
					phone: formData.phone || undefined,
					address: formData.address || undefined
				})
			})

			const data = await response.json()

			if (!response.ok) {
				setError(data.error || 'Error al crear la cuenta')
				setLoading(false)
				return
			}

			setSuccess(true)
			setTimeout(() => {
				if (onSuccess) {
					onSuccess()
				} else {
					router.push('/pricing/coaches')
				}
			}, 2000)
		} catch (err) {
			setError('Error inesperado. Intenta nuevamente.')
			setLoading(false)
		}
	}

	if (success) {
		return (
			<div className="w-full space-y-6">
				<div className="text-center space-y-2">
					<div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
						<CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
					</div>
					<h3 className="text-xl font-bold">¡Cuenta de coach creada exitosamente!</h3>
					<p className="text-sm text-muted-foreground">
						Redirigiendo a planes disponibles...
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="w-full space-y-6">
			<form onSubmit={handleSubmit} className="space-y-5">
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className="space-y-2">
					<label htmlFor="fullName" className="label-md">
						Nombre Completo
					</label>
					<Input
						id="fullName"
						name="fullName"
						type="text"
						placeholder="Tu nombre completo"
						value={formData.fullName}
						onChange={handleChange}
						required
						disabled={loading}
					/>
				</div>

				<div className="space-y-2">
					<label htmlFor="email" className="label-md">
						Email
					</label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="tu@email.com"
						value={formData.email}
						onChange={handleChange}
						required
						disabled={loading}
					/>
				</div>

				<div className="space-y-2">
					<label htmlFor="businessName" className="label-md">
						Nombre del Negocio
					</label>
					<Input
						id="businessName"
						name="businessName"
						type="text"
						placeholder="Ej: CrossFit Box"
						value={formData.businessName}
						onChange={handleChange}
						disabled={loading}
					/>
				</div>

				<div className="space-y-2">
					<label htmlFor="phone" className="label-md">
						Teléfono
					</label>
					<Input
						id="phone"
						name="phone"
						type="tel"
						placeholder="+54 9 11 1234-5678"
						value={formData.phone}
						onChange={handleChange}
						disabled={loading}
					/>
				</div>

				<div className="space-y-2">
					<label htmlFor="address" className="label-md">
						Dirección
					</label>
					<Input
						id="address"
						name="address"
						type="text"
						placeholder="Dirección de tu box/gimnasio"
						value={formData.address}
						onChange={handleChange}
						disabled={loading}
					/>
				</div>

				<div className="space-y-2">
					<label htmlFor="password" className="label-md">
						Contraseña
					</label>
					<div className="relative">
						<Input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="Mínimo 6 caracteres"
							value={formData.password}
							onChange={handleChange}
							required
							disabled={loading}
							className="pr-10"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
							disabled={loading}
						>
							{showPassword ? (
								<EyeOff className="w-5 h-5" />
							) : (
								<Eye className="w-5 h-5" />
							)}
						</button>
					</div>
				</div>

				<div className="space-y-2">
					<label htmlFor="confirmPassword" className="label-md">
						Confirmar Contraseña
					</label>
					<div className="relative">
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							placeholder="Confirma tu contraseña"
							value={formData.confirmPassword}
							onChange={handleChange}
							required
							disabled={loading}
							className="pr-10"
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
							disabled={loading}
						>
							{showConfirmPassword ? (
								<EyeOff className="w-5 h-5" />
							) : (
								<Eye className="w-5 h-5" />
							)}
						</button>
					</div>
				</div>

				<Button
					type="submit"
					size="lg"
					className="w-full uppercase tracking-[0.15em] text-base"
					disabled={loading}
				>
					{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Crear Cuenta de Coach
				</Button>
			</form>

			<div className="text-center">
				<span className="text-sm text-muted-foreground">
					¿Ya tienes cuenta?{" "}
				</span>
				<button
					type="button"
					onClick={onSwitchToLogin}
					className="text-sm font-semibold text-primary hover:text-primary-dim transition-colors"
				>
					Inicia sesión aquí
				</button>
			</div>
		</div>
	)
}
