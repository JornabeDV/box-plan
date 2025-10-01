'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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
      
      // Obtener IDs de usuarios asignados al admin
      const { data: assignments, error: assignmentsError } = await supabase
        .from('admin_user_assignments')
        .select('user_id')
        .eq('admin_id', adminId)
        .eq('is_active', true)

      if (assignmentsError) {
        console.error('Error loading user assignments:', assignmentsError)
        return
      }

      if (!assignments || assignments.length === 0) {
        setUsers([])
        return
      }

      // Obtener IDs de usuarios
      const userIds = assignments.map(a => a.user_id)

      // Obtener datos de usuarios, suscripciones y preferencias en paralelo
      const [usersResult, subscriptionsResult, preferencesResult] = await Promise.all([
        // Obtener datos de usuarios desde profiles
        supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)
          .order('created_at', { ascending: false }),
        
        // Obtener suscripciones activas
        supabase
          .from('subscriptions')
          .select(`
            *,
            plan:subscription_plans(*)
          `)
          .in('user_id', userIds)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        
        // Obtener preferencias de usuarios
        supabase
          .from('user_preferences')
          .select(`
            *,
            discipline:disciplines(id, name, color),
            level:discipline_levels(id, name, description)
          `)
          .in('user_id', userIds)
      ])

      if (usersResult.error) {
        console.error('Error loading users:', usersResult.error)
        return
      }

      if (subscriptionsResult.error) {
        console.error('Error loading subscriptions:', subscriptionsResult.error)
      }

      if (preferencesResult.error) {
        console.error('Error loading preferences:', preferencesResult.error)
      }

      // Debug: Log de preferencias cargadas
      console.log('Preferences loaded:', preferencesResult.data)

      // Combinar usuarios con suscripciones y preferencias
      const usersWithData: UserWithSubscription[] = (usersResult.data || []).map(user => {
        const userSubscriptions = subscriptionsResult.data?.filter(s => s.user_id === user.id) || []
        const activeSubscription = userSubscriptions[0] // La más reciente
        const userPreference = preferencesResult.data?.find(p => p.user_id === user.id)
        
        // Mapear correctamente las preferencias con las relaciones de Supabase
        const mappedPreference = userPreference ? {
          id: userPreference.id,
          user_id: userPreference.user_id,
          preferred_discipline_id: userPreference.preferred_discipline_id,
          preferred_level_id: userPreference.preferred_level_id,
          created_at: userPreference.created_at,
          updated_at: userPreference.updated_at,
          discipline: userPreference.discipline ? {
            id: userPreference.discipline.id,
            name: userPreference.discipline.name,
            color: userPreference.discipline.color
          } : null,
          level: userPreference.level ? {
            id: userPreference.level.id,
            name: userPreference.level.name,
            description: userPreference.level.description
          } : null
        } : null
        
        return {
          ...user,
          subscription: activeSubscription,
          has_subscription: !!activeSubscription,
          subscription_status: activeSubscription?.status || 'sin_suscripcion',
          preferences: mappedPreference
        }
      })

      // Debug: Log de usuarios finales
      console.log('Users with data:', usersWithData)
      
      setUsers(usersWithData)
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Cargar planes de suscripción
  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) {
        console.error('Error loading plans:', error)
        return
      }

      setPlans(data || [])
    } catch (err) {
      console.error('Error loading plans:', err)
    }
  }

  // Asignar suscripción
  const assignSubscription = async (userId: string, planId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
          cancel_at_period_end: false
        })

      if (error) {
        console.error('Error assigning subscription:', error)
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
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          cancel_at_period_end: true 
        })
        .eq('id', subscriptionId)

      if (error) {
        console.error('Error canceling subscription:', error)
        return
      }

      // Recargar usuarios
      await loadUsers()
    } catch (err) {
      console.error('Error canceling subscription:', err)
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
    cancelSubscription
  }
}
