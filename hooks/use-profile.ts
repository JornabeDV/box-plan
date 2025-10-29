'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

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

  const { data: session } = useSession()

  // Cargar perfil del usuario
  const loadProfile = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const userId = session?.user?.id
      if (!userId) {
        setState(prev => ({ ...prev, loading: false, profile: null }))
        return
      }

      // Llamar a API route
      const response = await fetch('/api/profile')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load profile')
      }

      // Si no hay perfil, crear uno básico con la información del usuario
      if (!data) {
        console.log('No profile found for user, creating basic profile')
        const basicProfile: Profile = {
          id: userId,
          email: session.user?.email || '',
          full_name: session.user?.name || null,
          avatar_url: session.user?.image || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setState(prev => ({ ...prev, profile: basicProfile, loading: false }))
      } else {
        setState(prev => ({ ...prev, profile: data, loading: false }))
      }
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
      const userId = session?.user?.id
      if (!userId) return

      const response = await fetch('/api/subscription')
      if (!response.ok) return

      const data = await response.json()
      
      if (data && data.subscription) {
        setState(prev => ({ ...prev, subscription: data.subscription }))
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
      const userId = session?.user?.id
      if (!userId) return

      const response = await fetch('/api/payment-history')
      if (!response.ok) return

      const data = await response.json()
      
      if (data && data.paymentHistory) {
        setState(prev => ({ ...prev, paymentHistory: data.paymentHistory }))
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
      const userId = session?.user?.id
      if (!userId) throw new Error('Usuario no autenticado')

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el perfil')
      }

      const data = await response.json()

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