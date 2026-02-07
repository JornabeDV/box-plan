'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

		// Validaciones
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
			// Redirigir a pricing de coaches después de 2 segundos
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
			<Card className="w-full max-w-md mx-auto">
				<CardContent className="pt-6">
					<div className="text-center space-y-4">
						<CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
						<div>
							<h3 className="text-lg font-semibold">¡Cuenta de coach creada exitosamente!</h3>
							<p className="text-sm text-muted-foreground">
								Redirigiendo a planes disponibles...
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl font-bold">Registro de Coach</CardTitle>
				<CardDescription>
					Crea tu cuenta y comienza a gestionar tus estudiantes
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="space-y-2">
						<Label htmlFor="fullName">Nombre Completo *</Label>
						<Input
							id="fullName"
							name="fullName"
							type="text"
							placeholder="Tu nombre completo"
              className="text-sm placeholder:text-sm"
							value={formData.fullName}
							onChange={handleChange}
							required
							disabled={loading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email *</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="tu@email.com"
              className="text-sm placeholder:text-sm"
							value={formData.email}
							onChange={handleChange}
							required
							disabled={loading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="businessName">Nombre del Negocio</Label>
						<Input
							id="businessName"
							name="businessName"
							type="text"
							placeholder="Ej: CrossFit Box"
              className="text-sm placeholder:text-sm"
							value={formData.businessName}
							onChange={handleChange}
							disabled={loading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="phone">Teléfono</Label>
						<Input
							id="phone"
							name="phone"
							type="tel"
							placeholder="+54 9 11 1234-5678"
              className="text-sm placeholder:text-sm"
							value={formData.phone}
							onChange={handleChange}
							disabled={loading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="address">Dirección</Label>
						<Input
							id="address"
							name="address"
							type="text"
							placeholder="Dirección de tu box/gimnasio"
							className="text-sm placeholder:text-sm"
							value={formData.address}
							onChange={handleChange}
							disabled={loading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Contraseña *</Label>
						<div className="relative">
							<Input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								placeholder="Mínimo 6 caracteres"
								className="text-sm placeholder:text-sm"
								value={formData.password}
								onChange={handleChange}
								required
								disabled={loading}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
								onClick={() => setShowPassword(!showPassword)}
								disabled={loading}
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
						<div className="relative">
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								placeholder="Confirma tu contraseña"
								className="text-sm placeholder:text-sm"
								value={formData.confirmPassword}
								onChange={handleChange}
								required
								disabled={loading}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								disabled={loading}
							>
								{showConfirmPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={loading}
					>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Crear Cuenta de Coach
					</Button>

					<div className="text-center text-sm">
						<span className="text-muted-foreground">¿Ya tienes cuenta? </span>
						<Button
							type="button"
							variant="link"
							className="p-0 h-auto font-semibold"
							onClick={onSwitchToLogin}
							disabled={loading}
						>
							Inicia sesión aquí
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}