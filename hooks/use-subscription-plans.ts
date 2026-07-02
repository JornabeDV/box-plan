'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  interval: string
  features: any
  is_active: boolean
  is_personalized?: boolean
  shareToken?: string | null
  coach?: {
    id: number
    businessName: string | null
    phone: string | null
    user: { name: string | null; email: string }
  } | null
  created_at?: string
  updated_at?: string
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [updateTrigger, setUpdateTrigger] = useState(0)
  const { toast } = useToast()

  // Cargar planes
  const loadPlans = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      // Agregar timestamp para evitar caché del navegador
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/subscription-plans?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error('Error al cargar planes')
      }

      const data = await response.json()
      // Crear un nuevo array con nuevos objetos para forzar re-render
      const newPlans = Array.isArray(data) 
        ? data.map(plan => ({
            ...plan,
            price: Number(plan.price),
            features: Array.isArray(plan.features) ? [...plan.features] : plan.features
          }))
        : []
      setPlans(newPlans)
      // Incrementar trigger para forzar re-render
      setUpdateTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Error loading plans:', err)
      toast({
        title: 'Error',
        description: 'Error al cargar los planes de suscripción',
        variant: 'destructive'
      })
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  // Crear plan
  const createPlan = async (planData: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/subscription-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al crear el plan')
      }

      const newPlan = await response.json()
      await loadPlans()
      
      toast({
        title: 'Plan creado',
        description: `El plan "${newPlan.name}" ha sido creado exitosamente`,
        variant: 'default'
      })

      return { success: true, plan: newPlan }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el plan'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return { success: false, error: errorMessage }
    }
  }

  // Cargar un plan específico por ID (público, para links compartibles)
  const loadPlanById = async (planId: string) => {
    try {
      const response = await fetch(`/api/subscription-plans/${planId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar el plan')
      }

      const data = await response.json()
      const normalizedPlan: SubscriptionPlan = {
        id: String(data.id),
        name: data.name,
        description: data.description ?? null,
        price: Number(data.price),
        currency: data.currency,
        interval: data.interval,
        features: Array.isArray(data.features) 
          ? data.features 
          : typeof data.features === 'string' 
            ? JSON.parse(data.features) 
            : data.features ?? [],
        is_active: data.is_active ?? true,
        is_personalized: data.is_personalized ?? false,
        shareToken: data.shareToken ?? data.share_token ?? null,
        coach: data.coach,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
      return { success: true, plan: normalizedPlan }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el plan'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return { success: false, error: errorMessage }
    }
  }

  // Actualizar plan
  const updatePlan = async (planId: string, planData: Partial<SubscriptionPlan>) => {
    try {
      const response = await fetch(`/api/subscription-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al actualizar el plan')
      }

      const updatedPlan = await response.json()
      
      // Normalizar el plan actualizado - crear un objeto completamente nuevo
      const normalizedPlan: SubscriptionPlan = {
        id: updatedPlan.id,
        name: updatedPlan.name,
        description: updatedPlan.description ?? null,
        price: Number(updatedPlan.price),
        currency: updatedPlan.currency,
        interval: updatedPlan.interval,
        features: Array.isArray(updatedPlan.features) 
          ? [...updatedPlan.features] 
          : (typeof updatedPlan.features === 'string' 
              ? JSON.parse(updatedPlan.features) 
              : []),
        is_active: updatedPlan.is_active ?? true,
        is_personalized: updatedPlan.is_personalized ?? false,
        shareToken: updatedPlan.shareToken ?? updatedPlan.share_token ?? null,
        created_at: updatedPlan.created_at,
        updated_at: updatedPlan.updated_at
      }
      
      // Actualizar estado de forma síncrona y forzar re-render
      setPlans(prevPlans => {
        // Crear un nuevo array completamente nuevo
        const newPlans = prevPlans.map(plan => {
          if (plan.id === planId) {
            // Retornar un objeto completamente nuevo
            const updated = {
              id: normalizedPlan.id,
              name: normalizedPlan.name,
              description: normalizedPlan.description,
              price: normalizedPlan.price,
              currency: normalizedPlan.currency,
              interval: normalizedPlan.interval,
              features: normalizedPlan.features,
              is_active: normalizedPlan.is_active,
              shareToken: normalizedPlan.shareToken,
              created_at: normalizedPlan.created_at,
              updated_at: normalizedPlan.updated_at
            }
            return updated
          }
          // Retornar copia del plan existente
          return {
            ...plan,
            features: Array.isArray(plan.features) ? [...plan.features] : plan.features
          }
        })
        return newPlans
      })
      
      // Incrementar trigger para forzar re-render en componentes
      setUpdateTrigger(prev => {
        const newTrigger = prev + 1
        return newTrigger
      })
      
      // Recargar planes desde el servidor sin mostrar loading para sincronizar
      await loadPlans(false)
      
      toast({
        title: 'Plan actualizado',
        description: 'El plan ha sido actualizado exitosamente',
        variant: 'default'
      })

      return { success: true, plan: normalizedPlan }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el plan'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return { success: false, error: errorMessage }
    }
  }

  // Eliminar plan (soft delete: desactivar)
  const deletePlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/subscription-plans/${planId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al eliminar el plan')
      }

      await loadPlans()
      
      toast({
        title: 'Plan eliminado',
        description: 'El plan ha sido desactivado exitosamente',
        variant: 'default'
      })

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar el plan'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return { success: false, error: errorMessage }
    }
  }

  // Cargar planes al montar
  useEffect(() => {
    loadPlans()
  }, [])

  return {
    plans,
    loading,
    loadPlans,
    loadPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    updateTrigger // Exportar el trigger para que los componentes puedan usarlo
  }
}