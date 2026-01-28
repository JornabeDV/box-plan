"use client"

import { useState, useEffect } from 'react'

export interface Planification {
  id: string
  coach_id: string
  discipline_id: string
  discipline_level_id: string
  date: string
  estimated_duration?: number
  blocks: Array<{
    id: string
    title: string
    items: string[]
    order: number
    notes?: string
  }>
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Campos de personalización
  is_personalized: boolean
  target_user_id: string | null
  target_user?: {
    id: string
    name: string
    email: string
  } | null
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

export function usePlanifications(coachId?: string) {
  const [planifications, setPlanifications] = useState<Planification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar planificaciones desde la base de datos
  const loadPlanifications = async () => {
    if (!coachId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/planifications?coachId=${coachId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar planificaciones')
      }

      const data = await response.json()
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
      if (!planificationData.coach_id) {
        const errorMessage = 'ID de coach requerido'
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

      const response = await fetch('/api/planifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planificationData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al crear planificación' }))
        setError(errorData.error || 'Error al crear planificación')
        return { error: errorData.error || 'Error al crear planificación' }
      }

      const data = await response.json()
      
      // Obtener con relaciones
      const withRelations = {
        ...data,
        discipline: data.discipline,
        discipline_level: data.discipline_level
      }
      
      setPlanifications(prev => [withRelations, ...prev])
      return { data: withRelations, error: null }
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

      // Validar que los datos requeridos estén presentes si se están actualizando
      if (updates.discipline_id && !updates.discipline_level_id) {
        const errorMessage = 'Debe seleccionar un nivel de disciplina'
        setError(errorMessage)
        return { error: errorMessage }
      }

      const response = await fetch(`/api/planifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al actualizar planificación' }))
        setError(errorData.error || 'Error al actualizar planificación')
        return { error: errorData.error || 'Error al actualizar planificación' }
      }

      const data = await response.json()
      
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

      const response = await fetch(`/api/planifications/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al eliminar planificación' }))
        setError(errorData.error || 'Error al eliminar planificación')
        return { error: errorData.error || 'Error al eliminar planificación' }
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
    if (!coachId) return

    try {
      setLoading(true)
      setError(null)

      // Obtener todas las planificaciones y filtrar por notas
      const response = await fetch(`/api/planifications?coachId=${coachId}`)
      
      if (!response.ok) {
        throw new Error('Error al buscar planificaciones')
      }

      const data = await response.json()
      
      // Filtrar en el cliente por notas
      const filtered = data.filter((p: Planification) => 
        p.notes?.toLowerCase().includes(query.toLowerCase())
      )
      
      setPlanifications(filtered)
    } catch (err) {
      console.error('Error in searchPlanifications:', err)
      setError('Error al buscar planificaciones')
    } finally {
      setLoading(false)
    }
  }

  // No cargar automáticamente - solo cuando se llama explícitamente loadPlanifications
  // Esto permite usar el hook solo para operaciones CRUD sin cargar datos iniciales
  // useEffect(() => {
  //   loadPlanifications()
  // }, [coachId])

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