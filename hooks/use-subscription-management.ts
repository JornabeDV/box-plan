import { useState, useEffect } from 'react'
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
        throw new Error('Error al cargar planes')
      }

      const data = await response.json()
      setPlans(data)
    } catch (error) {
      console.error('Error loading plans:', error)
      setError('Error al cargar los planes')
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
      setCurrentSubscription(data)
    } catch (error) {
      console.error('Error loading subscription:', error)
      setError('Error al cargar la suscripción')
    }
  }

  // Cambiar plan
  const changePlan = async (newPlanId: string) => {
    if (!currentSubscription) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/subscriptions/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId,
          currentSubscriptionId: currentSubscription.id
        })
      })

      if (!response.ok) {
        throw new Error('Error al cambiar plan')
      }

      const { data } = await response.json()
      setCurrentSubscription(data)
      
      toast({
        title: "Plan cambiado exitosamente",
        description: `Tu suscripción ha sido actualizada exitosamente`,
      })

    } catch (error) {
      console.error('Error changing plan:', error)
      toast({
        title: "Error al cambiar plan",
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
        throw new Error('Error al cancelar suscripción')
      }

      setCurrentSubscription(prev => prev ? {
        ...prev,
        cancel_at_period_end: true
      } : null)

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
        throw new Error('Error al reactivar suscripción')
      }

      setCurrentSubscription(prev => prev ? {
        ...prev,
        cancel_at_period_end: false
      } : null)

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
        throw new Error('Error al renovar suscripción')
      }

      const newEndDate = new Date()
      newEndDate.setDate(newEndDate.getDate() + 30)

      setCurrentSubscription(prev => prev ? {
        ...prev,
        current_period_end: newEndDate.toISOString(),
        status: 'active'
      } : null)

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
      await Promise.all([
        loadPlans(),
        loadCurrentSubscription()
      ])
      setLoading(false)
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
    loadCurrentSubscription
  }
}