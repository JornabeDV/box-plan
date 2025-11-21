import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  features: string[]
  is_popular?: boolean
}

interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  mercadopago_subscription_id: string | null
  mercadopago_payment_id: string | null
  created_at: string
  updated_at: string
  subscription_plans?: {
    name: string
    price: number
    features: string[]
  }
}

export function useSubscriptionManagement() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar planes disponibles
  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al cargar planes')
      }

      const data = await response.json()
      
      // Verificar que data sea un array
      if (!Array.isArray(data)) {
        console.warn('La respuesta de planes no es un array:', data)
        setPlans([])
        return
      }

      // Asegurar que features sea un array
      const formattedPlans = data.map((plan: any) => ({
        ...plan,
        id: String(plan.id), // Asegurar que id sea string para consistencia
        features: Array.isArray(plan.features) 
          ? plan.features 
          : typeof plan.features === 'string' 
            ? (() => {
                try {
                  return JSON.parse(plan.features)
                } catch {
                  return []
                }
              })()
            : []
      }))
      setPlans(formattedPlans)
    } catch (error) {
      console.error('Error loading plans:', error)
      setError(error instanceof Error ? error.message : 'Error al cargar los planes')
      setPlans([]) // Asegurar que planes esté vacío en caso de error
    }
  }

  // Cargar suscripción actual
  const loadCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/current')
      
      if (!response.ok) {
        throw new Error('Error al cargar suscripción')
      }

      const { data } = await response.json()
      // Asegurar que features sea un array si existe
      if (data && data.subscription_plans && data.subscription_plans.features) {
        if (!Array.isArray(data.subscription_plans.features)) {
          data.subscription_plans.features = typeof data.subscription_plans.features === 'string'
            ? JSON.parse(data.subscription_plans.features)
            : []
        }
      }
      setCurrentSubscription(data)
    } catch (error) {
      console.error('Error loading subscription:', error)
      setError('Error al cargar la suscripción')
    }
  }

  // Cambiar plan o crear nueva suscripción
  const changePlan = async (newPlanId: string) => {
    setActionLoading(true)
    try {
      // Si no hay suscripción actual, crear una nueva
      if (!currentSubscription) {
        if (!session?.user?.id) {
          throw new Error('Usuario no autenticado')
        }

        const userId = typeof session.user.id === 'string' ? session.user.id : String(session.user.id)
        const planIdNum = typeof newPlanId === 'string' ? parseInt(newPlanId, 10) : newPlanId
        
        if (isNaN(planIdNum)) {
          throw new Error('ID de plan inválido')
        }
        
        // Obtener información del plan para crear la preferencia de pago
        const plan = plans.find(p => p.id === newPlanId || String(p.id) === String(newPlanId))
        
        if (!plan) {
          throw new Error('Plan no encontrado')
        }

        // Asegurar que el precio sea un número
        const planPrice = typeof plan.price === 'string' ? parseFloat(plan.price) : Number(plan.price)
        
        if (isNaN(planPrice)) {
          throw new Error('Precio del plan inválido')
        }

        // Crear preferencia de pago en MercadoPago (esto activará el split si está configurado)
        const preferenceResponse = await fetch('/api/create-payment-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_id: String(planIdNum),
            user_id: userId,
            plan: {
              id: String(planIdNum),
              name: plan.name,
              price: planPrice,
              currency: plan.currency,
              interval: plan.interval
            }
          })
        })

        if (!preferenceResponse.ok) {
          const errorData = await preferenceResponse.json()
          throw new Error(errorData.error || 'Error al crear preferencia de pago')
        }

        const { preference } = await preferenceResponse.json()
        
        // Redirigir a MercadoPago para completar el pago
        if (preference?.init_point) {
          window.location.href = preference.init_point
          return // No continuar, el usuario será redirigido
        } else {
          throw new Error('No se recibió URL de pago de MercadoPago')
        }
      } else {
        // Si hay suscripción, cambiar de plan
        const response = await fetch('/api/subscriptions/change-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newPlanId,
            currentSubscriptionId: currentSubscription.id
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al cambiar plan')
        }

        // Recargar la suscripción actual después del cambio
        await loadCurrentSubscription()
        
        toast({
          title: "Plan cambiado exitosamente",
          description: `Tu suscripción ha sido actualizada exitosamente`,
        })
      }

    } catch (error) {
      console.error('Error changing/creating plan:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Cancelar suscripción
  const cancelSubscription = async () => {
    if (!currentSubscription) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/subscriptions/${currentSubscription.id}/cancel`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cancelar suscripción')
      }

      // Recargar la suscripción después de cancelar
      await loadCurrentSubscription()

      toast({
        title: "Suscripción cancelada",
        description: "Tu suscripción será cancelada al final del período actual",
      })

    } catch (error) {
      console.error('Error canceling subscription:', error)
      toast({
        title: "Error al cancelar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Reactivar suscripción
  const reactivateSubscription = async () => {
    if (!currentSubscription) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/subscriptions/${currentSubscription.id}/reactivate`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al reactivar suscripción')
      }

      // Recargar la suscripción después de reactivar
      await loadCurrentSubscription()

      toast({
        title: "Suscripción reactivada",
        description: "Tu suscripción ha sido reactivada exitosamente",
      })

    } catch (error) {
      console.error('Error reactivating subscription:', error)
      toast({
        title: "Error al reactivar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Renovar suscripción
  const renewSubscription = async () => {
    if (!currentSubscription) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/subscriptions/${currentSubscription.id}/renew`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al renovar suscripción')
      }

      // Recargar la suscripción después de renovar
      await loadCurrentSubscription()

      toast({
        title: "Suscripción renovada",
        description: "Tu suscripción ha sido renovada exitosamente",
      })

    } catch (error) {
      console.error('Error renewing subscription:', error)
      toast({
        title: "Error al renovar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([
          loadPlans(),
          loadCurrentSubscription()
        ])
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return {
    plans,
    currentSubscription,
    loading,
    actionLoading,
    error,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    renewSubscription,
    loadCurrentSubscription,
    loadPlans
  }
}