'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionPlan {
	id: string
	name: string
	description: string | null
	price: number
	currency: string
	interval: string
	features: any
	is_active: boolean
}

interface AssignPlanModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	user: {
		id: string
		email: string
		full_name: string | null
	} | null
	plans: SubscriptionPlan[]
	onAssign: (userId: string, planId: string, paymentMethod: string) => Promise<void>
}

const PAYMENT_METHODS = [
	{ value: 'admin_assignment', label: 'Asignación Administrativa' },
	{ value: 'mercadopago', label: 'MercadoPago' },
	{ value: 'cash', label: 'Efectivo' },
	{ value: 'transfer', label: 'Transferencia Bancaria' },
	{ value: 'credit_card', label: 'Tarjeta de Crédito' },
	{ value: 'debit_card', label: 'Tarjeta de Débito' },
	{ value: 'other', label: 'Otro' }
]

export function AssignPlanModal({
	open,
	onOpenChange,
	user,
	plans,
	onAssign
}: AssignPlanModalProps) {
	const { toast } = useToast()
	const [selectedPlanId, setSelectedPlanId] = useState<string>('')
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('admin_assignment')
	const [assigning, setAssigning] = useState(false)

	// Reset form when modal opens/closes
	useEffect(() => {
		if (open) {
			setSelectedPlanId('')
			setSelectedPaymentMethod('admin_assignment')
		}
	}, [open])

	// Normalizar comparación de IDs (pueden ser string o número)
	const selectedPlan = plans.find(p => String(p.id) === String(selectedPlanId))

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!user || !selectedPlanId || !selectedPaymentMethod) {
			toast({
				title: 'Error de validación',
				description: 'Por favor, completa todos los campos requeridos.',
				variant: 'destructive'
			})
			return
		}

		// Obtener el plan nuevamente justo antes de usarlo (por si cambió)
		const planToAssign = plans.find(p => String(p.id) === String(selectedPlanId))
		
		if (!planToAssign) {
			toast({
				title: 'Error de validación',
				description: 'El plan seleccionado no es válido. Por favor, selecciona otro plan.',
				variant: 'destructive'
			})
			return
		}

		setAssigning(true)
		try {
			await onAssign(user.id, selectedPlanId, selectedPaymentMethod)
			toast({
				title: 'Plan asignado exitosamente',
				description: `El plan "${planToAssign.name}" ha sido asignado a ${user.full_name || user.email} con método de pago: ${PAYMENT_METHODS.find(m => m.value === selectedPaymentMethod)?.label}.`,
				variant: 'default'
			})
			onOpenChange(false)
		} catch (error) {
			toast({
				title: 'Error al asignar plan',
				description: error instanceof Error ? error.message : 'Ocurrió un error al asignar el plan. Por favor, intenta nuevamente.',
				variant: 'destructive'
			})
		} finally {
			setAssigning(false)
		}
	}

	if (!user) return null

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
				<DialogHeader>
					<DialogTitle>Asignar Plan de Suscripción</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Selección de Plan */}
					<div className="space-y-2">
						<Label htmlFor="plan">Plan de Suscripción *</Label>
						<Select
							value={selectedPlanId}
							onValueChange={setSelectedPlanId}
							required
						>
							<SelectTrigger id="plan">
								<SelectValue placeholder="Seleccionar plan" />
							</SelectTrigger>
							<SelectContent>
								{plans
									.filter(plan => plan.is_active)
									.map((plan) => (
										<SelectItem key={String(plan.id)} value={String(plan.id)}>
											<div className="flex flex-col">
												<span className="font-medium">{plan.name}</span>
												<span className="text-xs text-muted-foreground">
													{new Intl.NumberFormat('es-AR', {
														style: 'currency',
														currency: plan.currency,
													}).format(plan.price)} / {plan.interval === 'month' ? 'mes' : 'año'}
												</span>
											</div>
										</SelectItem>
									))}
							</SelectContent>
						</Select>
						{selectedPlan && (
							<div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
								<p className="font-medium">{selectedPlan.name}</p>
								{selectedPlan.description && (
									<p className="text-xs mt-1">{selectedPlan.description}</p>
								)}
								<p className="text-xs mt-1">
									Precio: {new Intl.NumberFormat('es-AR', {
										style: 'currency',
										currency: selectedPlan.currency,
									}).format(selectedPlan.price)} / {selectedPlan.interval === 'month' ? 'mes' : 'año'}
								</p>
							</div>
						)}
					</div>

					{/* Selección de Método de Pago */}
					<div className="space-y-2">
						<Label htmlFor="paymentMethod">Método de Pago *</Label>
						<Select
							value={selectedPaymentMethod}
							onValueChange={setSelectedPaymentMethod}
							required
						>
							<SelectTrigger id="paymentMethod">
								<SelectValue placeholder="Seleccionar método de pago" />
							</SelectTrigger>
							<SelectContent>
								{PAYMENT_METHODS.map((method) => (
									<SelectItem key={method.value} value={method.value}>
										{method.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							Selecciona cómo se realizó o se realizará el pago de esta suscripción.
						</p>
					</div>

					{/* Información de la suscripción */}
					{selectedPlan && (
						<div className="p-3 bg-muted/50 rounded-md space-y-1 text-sm">
							<p className="font-medium">Resumen:</p>
							<p className="text-muted-foreground">
								El usuario recibirá acceso inmediato al plan <strong>{selectedPlan.name}</strong> por 30 días.
							</p>
							<p className="text-muted-foreground">
								Método de pago: <strong>{PAYMENT_METHODS.find(m => m.value === selectedPaymentMethod)?.label}</strong>
							</p>
						</div>
					)}

					{/* Botones de acción */}
					<div className="flex max-sm:flex-col justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={assigning}
							className="hover:scale-100 active:scale-100"
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={assigning || !selectedPlanId || !selectedPaymentMethod}
							className="hover:scale-100 active:scale-100"
						>
							{assigning ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Asignando...
								</>
							) : (
								'Asignar Plan'
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}