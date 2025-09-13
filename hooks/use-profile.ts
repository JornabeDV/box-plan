import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
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

interface PaymentHistory {
  id: string
  user_id: string
  subscription_id: string | null
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  mercadopago_payment_id: string | null
  mercadopago_preference_id: string | null
  payment_method: string | null
  created_at: string
  updated_at: string
}

interface ProfileState {
  profile: Profile | null
  subscription: Subscription | null
  paymentHistory: PaymentHistory[]
  loading: boolean
  error: string | null
}

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    subscription: null,
    paymentHistory: [],
    loading: true,
    error: null
  })

  // Cargar perfil del usuario
  const loadProfile = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState(prev => ({ ...prev, loading: false, profile: null }))
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setState(prev => ({ ...prev, profile: data, loading: false }))
    } catch (error) {
      console.error('Error loading profile:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Error al cargar el perfil' 
      }))
    }
  }

  // Cargar suscripción actual
  const loadSubscription = async () => {
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

      // Usar datos reales de la base de datos
      if (data) {
        setState(prev => ({ ...prev, subscription: data }))
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error al cargar la suscripción' 
      }))
    }
  }

  // Cargar historial de pagos
  const loadPaymentHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Usar datos reales de la base de datos
      if (data) {
        setState(prev => ({ ...prev, paymentHistory: data }))
      }
    } catch (error) {
      console.error('Error loading payment history:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error al cargar el historial de pagos' 
      }))
    }
  }

  // Cargar todos los datos
  const loadAllData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    await Promise.all([
      loadProfile(),
      loadSubscription(),
      loadPaymentHistory()
    ])
    
    setState(prev => ({ ...prev, loading: false }))
  }

  // Actualizar perfil
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setState(prev => ({ ...prev, profile: data }))
      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el perfil'
      setState(prev => ({ ...prev, error: errorMessage }))
      return { data: null, error: errorMessage }
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadAllData()
  }, [])

  return {
    ...state,
    loadProfile,
    loadSubscription,
    loadPaymentHistory,
    loadAllData,
    updateProfile
  }
}