'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
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
      
      if (!response.ok) {
        // Si es 401, el usuario no está autenticado, esto es esperado
        if (response.status === 401) {
          setState(prev => ({ ...prev, loading: false, profile: null }))
          return
        }
        // Si hay otro error, crear perfil básico
        const basicProfile: Profile = {
          id: userId,
          email: session.user?.email || '',
          full_name: session.user?.name || null,
          avatar_url: session.user?.image || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setState(prev => ({ ...prev, profile: basicProfile, loading: false }))
        return
      }

      const data = await response.json()

      // Si no hay perfil, crear uno básico con la información del usuario
      if (!data) {
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
      if (!response.ok) {
        // Si no hay suscripción, está bien, no es un error
        if (response.status === 401 || response.status === 404) {
          return
        }
        throw new Error('Error al cargar suscripción')
      }

      const data = await response.json()
      
      // El endpoint devuelve directamente el objeto de suscripción o null
      if (data) {
        setState(prev => ({ ...prev, subscription: data }))
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
      // No actualizar el estado de error para suscripciones, es opcional
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
    if (session?.user?.id) {
      loadAllData()
    } else if (session !== undefined) {
      // Si la sesión está definitivamente cargada pero no hay usuario, detener loading
      setState(prev => ({ ...prev, loading: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  return {
    ...state,
    loadProfile,
    loadSubscription,
    loadPaymentHistory,
    loadAllData,
    updateProfile
  }
}