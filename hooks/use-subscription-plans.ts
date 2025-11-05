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
  created_at?: string
  updated_at?: string
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Cargar planes
  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscription-plans')
      
      if (!response.ok) {
        throw new Error('Error al cargar planes')
      }

      const data = await response.json()
      setPlans(data || [])
    } catch (err) {
      console.error('Error loading plans:', err)
      toast({
        title: 'Error',
        description: 'Error al cargar los planes de suscripción',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
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

  // Actualizar plan
  const updatePlan = async (planId: string, planData: Partial<SubscriptionPlan>) => {
    try {
      const response = await fetch(`/api/subscription-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al actualizar el plan')
      }

      await loadPlans()
      
      toast({
        title: 'Plan actualizado',
        description: 'El plan ha sido actualizado exitosamente',
        variant: 'default'
      })

      return { success: true }
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
    createPlan,
    updatePlan,
    deletePlan
  }
}