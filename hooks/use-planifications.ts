"use client"

import { useState, useEffect } from 'react'

export interface ExerciseRef {
  id: string
  name: string
  category?: string | null
  video_url?: string | null
  image_url?: string | null
}

export interface PlanificationItem {
  id: string
  description: string
  order: number
  exercise?: ExerciseRef | null
}

export interface SubBlock {
  id: string
  subtitle: string
  order: number
  items: PlanificationItem[]
  timer_mode?: string | null
  timer_config?: any
}

export interface Block {
  id: string
  title: string
  order: number
  notes?: string
  items: PlanificationItem[]
  subBlocks?: SubBlock[]
  timer_mode?: string | null
  timer_config?: any
}

export interface Planification {
  id: string
  coach_id: string
  discipline_id: string
  discipline_level_id: string
  date: string
  estimated_duration?: number
  blocks: Block[]
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  is_personalized: boolean
  target_user_id: string | null
  target_user?: {
    id: string
    name: string
    email: string
  } | null
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

  const createPlanification = async (planificationData: Omit<Planification, 'id' | 'created_at' | 'updated_at' | 'discipline' | 'discipline_level'>) => {
    try {
      setError(null)

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

  const updatePlanification = async (id: string, updates: Partial<Planification>) => {
    try {
      setError(null)

      if (!id) {
        const errorMessage = 'ID de planificación requerido'
        setError(errorMessage)
        return { error: errorMessage }
      }

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

  const searchPlanifications = async (query: string) => {
    if (!coachId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/planifications?coachId=${coachId}`)
      
      if (!response.ok) {
        throw new Error('Error al buscar planificaciones')
      }

      const data = await response.json()
      
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
