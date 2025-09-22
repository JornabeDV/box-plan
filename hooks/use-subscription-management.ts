import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error

      const formattedPlans = data?.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        price: parseFloat(plan.price),
        currency: plan.currency,
        interval: plan.interval,
        features: plan.features || [],
        is_popular: plan.name === 'Pro' // Marcar Pro como popular
      })) || []

      setPlans(formattedPlans)
    } catch (error) {
      console.error('Error loading plans:', error)
      setError('Error al cargar los planes')
    }
  }

  // Cargar suscripción actual
  const loadCurrentSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            price,
            features
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

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
      // 1. Crear nueva suscripción con el nuevo plan
      const { data: newPlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', newPlanId)
        .single()

      if (!newPlan) {
        throw new Error('Plan no encontrado')
      }

      // 2. Cancelar suscripción actual al final del período
      const { error: cancelError } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id)

      if (cancelError) throw cancelError

      // 3. Crear nueva suscripción
      const { data: newSubscription, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: currentSubscription.user_id,
          plan_id: newPlanId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          mercadopago_payment_id: `change_${Date.now()}`
        })
        .select(`
          *,
          subscription_plans (
            name,
            price,
            features
          )
        `)
        .single()

      if (createError) throw createError

      // 4. Crear registro de pago
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          user_id: currentSubscription.user_id,
          subscription_id: newSubscription.id,
          amount: newPlan.price,
          currency: newPlan.currency,
          status: 'approved',
          mercadopago_payment_id: `change_${Date.now()}`,
          payment_method: 'plan_change'
        })

      if (paymentError) throw paymentError

      setCurrentSubscription(newSubscription)
      toast({
        title: "Plan cambiado exitosamente",
        description: `Tu suscripción ha sido actualizada al plan ${newPlan.name}`,
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
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id)

      if (error) throw error

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
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id)

      if (error) throw error

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
      // Extender el período actual
      const newEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          current_period_end: newEndDate.toISOString(),
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id)

      if (error) throw error

      // Crear registro de pago
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          user_id: currentSubscription.user_id,
          subscription_id: currentSubscription.id,
          amount: currentSubscription.subscription_plans?.price || 0,
          currency: 'ARS',
          status: 'approved',
          mercadopago_payment_id: `renewal_${Date.now()}`,
          payment_method: 'mercadopago'
        })

      if (paymentError) throw paymentError

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