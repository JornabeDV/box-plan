import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plan, getPlanById } from '@/lib/plans'

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface SubscriptionState {
  subscription: UserSubscription | null
  loading: boolean
  error: string | null
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    subscription: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setState(prev => ({ ...prev, loading: false, subscription: null }))
        return
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        subscription: data || null 
      }))
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error al cargar la suscripción' 
      }))
    }
  }

  const createSubscription = async (planId: string, paymentMethod: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      const plan = getPlanById(planId)
      if (!plan) {
        throw new Error('Plan no encontrado')
      }

      // Crear preferencia de pago en MercadoPago via API route
      const response = await fetch('/api/create-payment-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          user_id: user.id,
          plan: {
            id: plan.id,
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
            interval: plan.interval
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear la preferencia de pago')
      }

      const { preference } = await response.json()
      
      // Redirect to MercadoPago checkout
      window.location.href = preference.init_point

      return { preference, error: null }
    } catch (error) {
      console.error('Error creating subscription:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la suscripción'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { preference: null, error: errorMessage }
    }
  }

  const cancelSubscription = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !state.subscription) {
        throw new Error('No hay suscripción activa')
      }

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.subscription.id)

      if (error) {
        throw error
      }

      // Recargar la suscripción
      await fetchSubscription()
    } catch (error) {
      console.error('Error canceling subscription:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al cancelar la suscripción'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
    }
  }

  const getCurrentPlan = (): Plan | null => {
    if (!state.subscription) return null
    return getPlanById(state.subscription.plan_id) || null
  }

  const isSubscribed = (): boolean => {
    return state.subscription?.status === 'active'
  }

  const hasFeature = (feature: string): boolean => {
    if (!isSubscribed()) return false
    
    const plan = getCurrentPlan()
    if (!plan) return false

    return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
  }

  return {
    ...state,
    createSubscription,
    cancelSubscription,
    getCurrentPlan,
    isSubscribed,
    hasFeature,
    refetch: fetchSubscription
  }
}