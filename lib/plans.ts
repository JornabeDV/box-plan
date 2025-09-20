export interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  popular?: boolean
  color: string
  icon: string
}

export const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    description: 'Perfecto para comenzar tu journey CrossFit',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Acceso a entrenamientos diarios',
      'Registro de entrenamientos',
      'Estadísticas básicas',
      'Soporte por email',
      '1 perfil de usuario'
    ],
    color: 'blue',
    icon: '🏃‍♂️'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para atletas serios que quieren maximizar su rendimiento',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Todo lo del plan Básico',
      'Entrenamientos personalizados',
      'Análisis avanzado de progreso',
      'Records personales ilimitados',
      'Planificación de entrenamientos',
      'Soporte prioritario',
      'Hasta 3 perfiles de usuario',
      'Exportar datos'
    ],
    popular: true,
    color: 'purple',
    icon: '💪'
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Para atletas profesionales y coaches',
    price: 39.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Todo lo del plan Pro',
      'Coaching personalizado',
      'Análisis de video',
      'Integración con wearables',
      'API personalizada',
      'Soporte 24/7',
      'Perfiles ilimitados',
      'White-label disponible',
      'Analytics avanzados'
    ],
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