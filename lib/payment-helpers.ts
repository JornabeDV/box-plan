/**
 * Helpers para cálculo y manejo de splits de pagos en el modelo B2B2C
 */

export interface PaymentSplit {
	totalAmount: number
	coachAmount: number
	platformAmount: number
	coachRate: number
	platformRate: number
}

/**
 * Calcula el split de un pago entre coach y plataforma
 * @param totalAmount - Monto total del pago
 * @param coachCommissionRate - Porcentaje que recibe el coach (ej: 88)
 * @param platformCommissionRate - Porcentaje que recibe la plataforma (ej: 12)
 * @returns Objeto con los montos calculados
 * @throws Error si las comisiones no suman 100%
 */
export function calculatePaymentSplit(
	totalAmount: number,
	coachCommissionRate: number,
	platformCommissionRate: number
): PaymentSplit {
	// Validar que sumen 100%
	const totalRate = coachCommissionRate + platformCommissionRate
	if (Math.abs(totalRate - 100) > 0.01) {
		throw new Error(
			`Las comisiones deben sumar 100%. Actual: ${totalRate}% (Coach: ${coachCommissionRate}%, Plataforma: ${platformCommissionRate}%)`
		)
	}

	const coachRate = coachCommissionRate / 100
	const platformRate = platformCommissionRate / 100

	const coachAmount = Math.round(totalAmount * coachRate * 100) / 100
	const platformAmount = Math.round(totalAmount * platformRate * 100) / 100

	// Ajustar por redondeo para que sumen exactamente el total
	const calculatedTotal = coachAmount + platformAmount
	const difference = totalAmount - calculatedTotal

	// Ajustar la diferencia en el monto más grande
	if (Math.abs(difference) > 0.01) {
		if (coachAmount >= platformAmount) {
			return {
				totalAmount,
				coachAmount: coachAmount + difference,
				platformAmount,
				coachRate: coachCommissionRate,
				platformRate: platformCommissionRate
			}
		} else {
			return {
				totalAmount,
				coachAmount,
				platformAmount: platformAmount + difference,
				coachRate: coachCommissionRate,
				platformRate: platformCommissionRate
			}
		}
	}

	return {
		totalAmount,
		coachAmount,
		platformAmount,
		coachRate: coachCommissionRate,
		platformRate: platformCommissionRate
	}
}

/**
 * Obtiene las tasas de comisión según el plan del coach
 * @param coachPlanName - Nombre del plan del coach ('starter', 'growth', 'enterprise')
 * @returns Objeto con las tasas de comisión
 */
export function getCommissionRatesByPlan(coachPlanName: string): {
	coach: number
	platform: number
} {
	const COMMISSION_RATES: Record<string, { coach: number; platform: number }> = {
		starter: { coach: 88, platform: 12 },
		growth: { coach: 90, platform: 10 },
		enterprise: { coach: 92, platform: 8 }
	}

	return (
		COMMISSION_RATES[coachPlanName.toLowerCase()] || COMMISSION_RATES.starter
	)
}

/**
 * Valida que las tasas de comisión sean válidas
 * @param coachRate - Tasa del coach
 * @param platformRate - Tasa de la plataforma
 * @returns true si son válidas, false en caso contrario
 */
export function validateCommissionRates(
	coachRate: number,
	platformRate: number
): boolean {
	const total = coachRate + platformRate
	return Math.abs(total - 100) < 0.01 && coachRate >= 0 && platformRate >= 0
}

/**
 * Calcula el split basado en el número de estudiantes (comisión variable)
 * @param totalAmount - Monto total
 * @param studentCount - Número de estudiantes del coach
 * @returns Objeto con los montos calculados
 */
export function calculateVariableCommissionSplit(
	totalAmount: number,
	studentCount: number
): PaymentSplit {
	let coachRate: number
	let platformRate: number

	if (studentCount <= 10) {
		coachRate = 88
		platformRate = 12
	} else if (studentCount <= 50) {
		coachRate = 90
		platformRate = 10
	} else {
		coachRate = 92
		platformRate = 8
	}

	return calculatePaymentSplit(totalAmount, coachRate, platformRate)
}