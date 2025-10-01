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

      // Validar que los datos requeridos estén presentes
      if (!planificationData.admin_id) {
        const errorMessage = 'ID de administrador requerido'
        setError(errorMessage)
        return { error: errorMessage }
      }

      if (!planificationData.discipline_id) {
        const errorMessage = 'ID de disciplina requerido'
        setError(errorMessage)
        return { error: errorMessage }
      }

      if (!planificationData.discipline_level_id) {
        const errorMessage = 'ID de nivel de disciplina requerido'
        setError(errorMessage)
        return { error: errorMessage }
      }

      if (!planificationData.date) {
        const errorMessage = 'Fecha requerida'
        setError(errorMessage)
        return { error: errorMessage }
      }

      // Insertar con timeout más corto y sin .single() inicialmente
      const insertPromise = supabase
        .from('planifications')
        .insert(planificationData)
        .select('*')
      
      const insertTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Insert timeout'))
        }, 5000)
      })
      
      let insertData, insertError
      try {
        const result = await Promise.race([
          insertPromise,
          insertTimeoutPromise
        ]) as any
        insertData = result.data
        insertError = result.error
      } catch (raceError) {
        insertData = null
        insertError = raceError
      }

      if (insertError) {
        let errorMessage = insertError.message
        
        // Proporcionar mensajes de error más específicos
        if (insertError.code === '23503') {
          if (insertError.message.includes('discipline_id')) {
            errorMessage = 'La disciplina seleccionada no existe'
          } else if (insertError.message.includes('discipline_level_id')) {
            errorMessage = 'El nivel de disciplina seleccionado no existe'
          } else if (insertError.message.includes('admin_id')) {
            errorMessage = 'El administrador no existe'
          }
        } else if (insertError.code === '23505') {
          errorMessage = 'Ya existe una planificación para esta fecha y disciplina'
        }
        
        setError(errorMessage)
        return { error: errorMessage }
      }

      if (!insertData || (Array.isArray(insertData) && insertData.length === 0)) {
        const errorMessage = 'No se pudo crear la planificación'
        setError(errorMessage)
        return { error: errorMessage }
      }

      // Manejar tanto array como objeto único
      const createdPlanification = Array.isArray(insertData) ? insertData[0] : insertData
      
      // Por ahora, usar solo los datos básicos sin relaciones para evitar timeout
      const basicData = {
        ...createdPlanification,
        discipline: null,
        discipline_level: null
      }
      
      setPlanifications(prev => [basicData, ...prev])
      return { data: basicData, error: null }
    } catch (err) {
      const errorMessage = 'Error inesperado al crear planificación'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Actualizar planificación
  const updatePlanification = async (id: string, updates: Partial<Planification>) => {
    try {
      setError(null)

      // Validar que el ID existe
      if (!id) {
        const errorMessage = 'ID de planificación requerido'
        setError(errorMessage)
        return { error: errorMessage }
      }

      // Verificar que la planificación existe antes de actualizar
      const { data: existingPlanification, error: fetchError } = await supabase
        .from('planifications')
        .select('id, admin_id')
        .eq('id', id)
        .single()

      if (fetchError) {
        setError('Planificación no encontrada')
        return { error: 'Planificación no encontrada' }
      }

      if (!existingPlanification) {
        setError('Planificación no encontrada')
        return { error: 'Planificación no encontrada' }
      }

      // Validar que los datos requeridos estén presentes si se están actualizando
      if (updates.discipline_id && !updates.discipline_level_id) {
        const errorMessage = 'Debe seleccionar un nivel de disciplina'
        setError(errorMessage)
        return { error: errorMessage }
      }

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
        let errorMessage = updateError.message
        
        // Proporcionar mensajes de error más específicos
        if (updateError.code === '23503') {
          if (updateError.message.includes('discipline_id')) {
            errorMessage = 'La disciplina seleccionada no existe'
          } else if (updateError.message.includes('discipline_level_id')) {
            errorMessage = 'El nivel de disciplina seleccionado no existe'
          }
        } else if (updateError.code === '23505') {
          errorMessage = 'Ya existe una planificación para esta fecha y disciplina'
        }
        
        setError(errorMessage)
        return { error: errorMessage }
      }

      if (!data) {
        setError('No se pudo actualizar la planificación')
        return { error: 'No se pudo actualizar la planificación' }
      }

      setPlanifications(prev => prev.map(p => p.id === id ? data : p))
      return { data, error: null }
    } catch (err) {
      const errorMessage = 'Error inesperado al actualizar planificación'
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
        setError(deleteError.message)
        return { error: deleteError.message }
      }

      setPlanifications(prev => prev.filter(p => p.id !== id))
      return { error: null }
    } catch (err) {
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