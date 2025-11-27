export interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  monthlyPersonalizedClasses: number
  features: string[]
  popular?: boolean
  color: string
  icon: string
}

export const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    description: 'Plan ideal para comenzar tu entrenamiento personalizado',
    price: 25000,
    currency: 'ARS',
    interval: 'month',
    monthlyPersonalizedClasses: 8,
    features: [
      '8 clases personalizadas por mes',
      'Acceso a entrenamientos diarios',
      'Registro de entrenamientos',
      'Estadísticas básicas',
      'Soporte por email'
    ],
    color: 'blue',
    icon: '🏃‍♂️'
  },
  {
    id: 'intermediate',
    name: 'Intermedio',
    description: 'Para atletas que buscan un entrenamiento más intensivo',
    price: 30000,
    currency: 'ARS',
    interval: 'month',
    monthlyPersonalizedClasses: 12,
    features: [
      '12 clases personalizadas por mes',
      'planificaciones de entrenamiento avanzadas',
      'Análisis de progreso detallado',
      'Records personales ilimitados',
      'Planificación mensual',
      'Soporte prioritario'
    ],
    color: 'purple',
    icon: '💪'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para atletas serios que buscan máximo rendimiento',
    price: 40000,
    currency: 'ARS',
    interval: 'month',
    monthlyPersonalizedClasses: 20,
    features: [
      '20 clases personalizadas por mes',
      'Entrenamientos completamente personalizados',
      'Análisis avanzado con gráficos detallados',
      'Coaching personalizado',
      'Planificación ilimitada',
      'Soporte 24/7',
    ],
    popular: true,
    color: 'gold',
    icon: '🏆'
  }
]

export const YEARLY_DISCOUNT = 0.2 // 20% de descuento por pago anual

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find(plan => plan.id === id)
}

export function getYearlyPrice(monthlyPrice: number): number {
  return monthlyPrice * 12 * (1 - YEARLY_DISCOUNT)
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
  }).format(price)
}