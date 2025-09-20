"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Planification {
  id: string
  admin_id: string
  discipline_id: string
  discipline_level_id: string
  date: string
  estimated_duration?: number
  blocks: Array<{
    id: string
    title: string
    items: string[]
    order: number
  }>
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Relaciones
  discipline?: {
    id: string
    name: string
    color: string
    icon: string
  }
  discipline_level?: {
    id: string
    name: string
    description?: string
  }
}

export function usePlanifications(adminId?: string) {
  const [planifications, setPlanifications] = useState<Planification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar planificaciones desde la base de datos
  const loadPlanifications = async () => {
    if (!adminId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('planifications')
        .select(`
          *,
          discipline:disciplines(id, name, color, icon),
          discipline_level:discipline_levels(id, name, description)
        `)
        .eq('admin_id', adminId)
        .order('date', { ascending: true })

      if (fetchError) {
        console.error('Error loading planifications:', fetchError)
        setError(fetchError.message)
        return
      }

      setPlanifications(data || [])
    } catch (err) {
      console.error('Error in loadPlanifications:', err)
      setError('Error al cargar planificaciones')
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva planificación
  const createPlanification = async (planificationData: Omit<Planification, 'id' | 'created_at' | 'updated_at' | 'discipline' | 'discipline_level'>) => {
    try {
      setError(null)

      const { data, error: createError } = await supabase
        .from('planifications')
        .insert(planificationData)
        .select(`
          *,
          discipline:disciplines(id, name, color, icon),
          discipline_level:discipline_levels(id, name, description)
        `)
        .single()

      if (createError) {
        console.error('Error creating planification:', createError)
        setError(createError.message)
        return { error: createError.message }
      }

      setPlanifications(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      console.error('Error in createPlanification:', err)
      const errorMessage = 'Error al crear planificación'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Actualizar planificación
  const updatePlanification = async (id: string, updates: Partial<Planification>) => {
    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from('planifications')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          discipline:disciplines(id, name, color, icon),
          discipline_level:discipline_levels(id, name, description)
        `)
        .single()

      if (updateError) {
        console.error('Error updating planification:', updateError)
        setError(updateError.message)
        return { error: updateError.message }
      }

      setPlanifications(prev => prev.map(p => p.id === id ? data : p))
      return { data, error: null }
    } catch (err) {
      console.error('Error in updatePlanification:', err)
      const errorMessage = 'Error al actualizar planificación'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Eliminar planificación
  const deletePlanification = async (id: string) => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('planifications')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting planification:', deleteError)
        setError(deleteError.message)
        return { error: deleteError.message }
      }

      setPlanifications(prev => prev.filter(p => p.id !== id))
      return { error: null }
    } catch (err) {
      console.error('Error in deletePlanification:', err)
      const errorMessage = 'Error al eliminar planificación'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Buscar planificaciones
  const searchPlanifications = async (query: string) => {
    if (!adminId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: searchError } = await supabase
        .from('planifications')
        .select(`
          *,
          discipline:disciplines(id, name, color, icon),
          discipline_level:discipline_levels(id, name, description)
        `)
        .eq('admin_id', adminId)
        .or(`notes.ilike.%${query}%`)
        .order('date', { ascending: true })

      if (searchError) {
        console.error('Error searching planifications:', searchError)
        setError(searchError.message)
        return
      }

      setPlanifications(data || [])
    } catch (err) {
      console.error('Error in searchPlanifications:', err)
      setError('Error al buscar planificaciones')
    } finally {
      setLoading(false)
    }
  }

  // Cargar planificaciones al montar el componente
  useEffect(() => {
    loadPlanifications()
  }, [adminId])

  return {
    planifications,
    loading,
    error,
    createPlanification,
    updatePlanification,
    deletePlanification,
    searchPlanifications,
    refresh: loadPlanifications
  }
}
