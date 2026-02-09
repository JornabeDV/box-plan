'use client'

import { useState, useEffect, useRef } from 'react'

interface UserWithSubscription {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  subscription?: {
    id: string
    user_id: string
    plan_id: string
    status: 'active' | 'canceled' | 'past_due' | 'unpaid'
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
    plan: {
      id: string
      name: string
      description: string | null
      price: number
      currency: string
      interval: string
      features: any
      is_active: boolean
    }
  } | null
  has_subscription: boolean
  subscription_status?: string
  preferences?: {
    id: string
    preferred_discipline_id: string | null
    preferred_level_id: string | null
    discipline?: {
      id: string
      name: string
      color: string
    }
    level?: {
      id: string
      name: string
      description: string | null
    }
  } | null
}

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  interval: string
  features: any
  is_active: boolean
}

export function useUsersManagement(coachId: string | null) {
  const [users, setUsers] = useState<UserWithSubscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const loadingUsersRef = useRef(false)
  const loadingPlansRef = useRef(false)
  const lastCoachIdRef = useRef<string | null>(null)
  const hasUsersDataRef = useRef(false)
  const hasPlansDataRef = useRef(false)

  // Cargar usuarios
  const loadUsers = async (forceRefresh = false) => {
    if (!coachId) return
    
    // Evitar llamadas duplicadas (a menos que sea un refresh forzado)
    if (loadingUsersRef.current && !forceRefresh) return
    if (lastCoachIdRef.current === coachId && hasUsersDataRef.current && !forceRefresh) return

    // Si es un refresh forzado, resetear los flags antes de continuar
    if (forceRefresh) {
      hasUsersDataRef.current = false
      loadingUsersRef.current = false
    }

    loadingUsersRef.current = true
    lastCoachIdRef.current = coachId

    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/users?coachId=${coachId}`, {
        cache: forceRefresh ? 'no-store' : 'default'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error loading users:', errorData.error || 'Unknown error')
        setUsers([])
        return
      }

      const data = await response.json()
      setUsers(data || [])
      hasUsersDataRef.current = true
    } catch (err) {
      console.error('Error loading users:', err)
      lastCoachIdRef.current = null
      hasUsersDataRef.current = false
    } finally {
      setLoading(false)
      loadingUsersRef.current = false
    }
  }

  // Cargar planes de suscripción
  const loadPlans = async () => {
    // Evitar llamadas duplicadas
    if (loadingPlansRef.current) return
    if (hasPlansDataRef.current) return

    loadingPlansRef.current = true

    try {
      const response = await fetch('/api/subscription-plans', {
        cache: 'default'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error loading plans:', errorData.error || 'Unknown error')
        setPlans([])
        return
      }

      const data = await response.json()
      setPlans(data || [])
      hasPlansDataRef.current = true
      
      if (!data || data.length === 0) {
        console.warn('No hay planes de suscripción disponibles en la base de datos')
      }
    } catch (err) {
      console.error('Error loading plans:', err)
      setPlans([])
      hasPlansDataRef.current = false
    } finally {
      loadingPlansRef.current = false
    }
  }

  // Asignar suscripción
  const assignSubscription = async (userId: string, planId: string, paymentMethod: string = 'admin_assignment'): Promise<void> => {
    try {
      const requestBody: any = {
        user_id: userId,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        payment_method: paymentMethod
      }

      // Incluir coachId si está disponible
      if (coachId) {
        requestBody.coach_id = coachId
      }

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al asignar suscripción')
      }

      // Recargar usuarios (forzar refresh para obtener datos actualizados)
      await loadUsers(true)
    } catch (err) {
      console.error('Error assigning subscription:', err)
      throw err
    }
  }

  // Cancelar suscripción
  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al cancelar suscripción')
      }

      // Recargar usuarios (forzar refresh para obtener datos actualizados)
      await loadUsers(true)
    } catch (err) {
      console.error('Error canceling subscription:', err)
      throw err
    }
  }

  // Cambiar plan de suscripción
  const changePlan = async (userId: string, newPlanId: string) => {
    try {
      // Intentar obtener la suscripción actual del usuario del estado local
      const user = users.find(u => u.id === userId)
      const currentSubscription = user?.subscription

      const response = await fetch('/api/subscriptions/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId,
          // Si tenemos la suscripción local, la pasamos; si no, el endpoint buscará por targetUserId
          currentSubscriptionId: currentSubscription?.id,
          targetUserId: userId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al cambiar de plan')
      }

      // Recargar usuarios para reflejar el cambio
      await loadUsers(true)
    } catch (err) {
      console.error('Error changing plan:', err)
      throw err
    }
  }

  // Reactivar suscripción (para suscripciones canceladas o vencidas)
  const reactivateSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/reactivate`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al reactivar suscripción')
      }

      // Recargar usuarios (forzar refresh para obtener datos actualizados)
      await loadUsers(true)
    } catch (err) {
      console.error('Error reactivating subscription:', err)
      throw err
    }
  }

  // Eliminar usuario
  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Error al eliminar usuario')
      }

      // Recargar usuarios (forzar refresh para obtener datos actualizados)
      await loadUsers(true)
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar usuario'
      console.error('Error deleting user:', err)
      return { error: errorMessage }
    }
  }

  // No cargar automáticamente - solo cuando se llama explícitamente
  // Esto permite usar el hook solo para operaciones CRUD sin cargar datos iniciales
  // useEffect(() => {
  //   if (lastCoachIdRef.current !== coachId) {
  //     hasUsersDataRef.current = false
  //   }
  //   if (coachId) {
  //     loadUsers()
  //     loadPlans()
  //   }
  // }, [coachId])

  return {
    users,
    plans,
    loading,
    loadUsers,
    assignSubscription,
    cancelSubscription,
    changePlan,
    reactivateSubscription,
    deleteUser
  }
}