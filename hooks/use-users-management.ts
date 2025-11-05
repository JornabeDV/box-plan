'use client'

import { useState, useEffect } from 'react'

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

export function useUsersManagement(adminId: string | null) {
  const [users, setUsers] = useState<UserWithSubscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar usuarios
  const loadUsers = async () => {
    if (!adminId) return

    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/users?adminId=${adminId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error loading users:', errorData.error || 'Unknown error')
        setUsers([])
        return
      }

      const data = await response.json()
      setUsers(data || [])
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Cargar planes de suscripción
  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error loading plans:', errorData.error || 'Unknown error')
        setPlans([])
        return
      }

      const data = await response.json()
      setPlans(data || [])
      
      if (!data || data.length === 0) {
        console.warn('No hay planes de suscripción disponibles en la base de datos')
      }
    } catch (err) {
      console.error('Error loading plans:', err)
      setPlans([])
    }
  }

  // Asignar suscripción
  const assignSubscription = async (userId: string, planId: string) => {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false
        })
      })

      if (!response.ok) {
        console.error('Error assigning subscription')
        return
      }

      // Recargar usuarios
      await loadUsers()
    } catch (err) {
      console.error('Error assigning subscription:', err)
    }
  }

  // Cancelar suscripción
  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        console.error('Error canceling subscription')
        return
      }

      // Recargar usuarios
      await loadUsers()
    } catch (err) {
      console.error('Error canceling subscription:', err)
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

      // Recargar usuarios
      await loadUsers()
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar usuario'
      console.error('Error deleting user:', err)
      return { error: errorMessage }
    }
  }

  // Cargar datos al montar
  useEffect(() => {
    if (adminId) {
      loadUsers()
      loadPlans()
    }
  }, [adminId])

  return {
    users,
    plans,
    loading,
    loadUsers,
    assignSubscription,
    cancelSubscription,
    deleteUser
  }
}