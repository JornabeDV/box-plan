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
    id: 'intermediate',
    name: 'Intermedio',
    description: 'Para atletas que quieren llevar su entrenamiento al siguiente nivel',
    price: 14.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Todo lo del plan Básico',
      'Planillas de entrenamiento avanzadas',
      'Análisis de progreso detallado',
      'Records personales ilimitados',
      'Planificación mensual',
      'Soporte prioritario',
      'Hasta 2 perfiles de usuario',
      'Exportar datos'
    ],
    color: 'purple',
    icon: '💪'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para atletas serios y coaches que quieren maximizar su rendimiento',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Todo lo del plan Intermedio',
      'Entrenamientos completamente personalizados',
      'Análisis avanzado con gráficos detallados',
      'Coaching personalizado',
      'Planificación ilimitada',
      'Soporte 24/7',
      'Hasta 5 perfiles de usuario',
      'Integración con wearables',
      'Analytics avanzados',
      'API personalizada'
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