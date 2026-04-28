"use client"

import { useState, useCallback } from 'react'

export interface CoachExercise {
  id: string
  name: string
  category?: string | null
  description?: string | null
  video_url?: string | null
  image_url?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useCoachExercises() {
  const [exercises, setExercises] = useState<CoachExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadExercises = useCallback(async (search?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/exercises?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar ejercicios')
      const data = await res.json()
      setExercises(data || [])
    } catch (err) {
      setError('Error al cargar ejercicios')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createExercise = async (data: {
    name: string
    category?: string
    description?: string
    video_url?: string
    image_url?: string
  }): Promise<{ data?: CoachExercise; error?: string }> => {
    try {
      setError(null)
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        return { error: err.error || 'Error al crear ejercicio' }
      }
      const created = await res.json()
      setExercises((prev) => [created, ...prev])
      return { data: created }
    } catch (err) {
      return { error: 'Error al crear ejercicio' }
    }
  }

  const updateExercise = async (
    id: string,
    data: Partial<CoachExercise>
  ): Promise<{ data?: CoachExercise; error?: string }> => {
    try {
      setError(null)
      const res = await fetch(`/api/exercises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        return { error: err.error || 'Error al actualizar ejercicio' }
      }
      const updated = await res.json()
      setExercises((prev) =>
        prev.map((e) => (e.id === id ? updated : e))
      )
      return { data: updated }
    } catch (err) {
      return { error: 'Error al actualizar ejercicio' }
    }
  }

  const deleteExercise = async (id: string): Promise<{ error?: string }> => {
    try {
      setError(null)
      const res = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        return { error: err.error || 'Error al eliminar ejercicio' }
      }
      setExercises((prev) => prev.filter((e) => e.id !== id))
      return {}
    } catch (err) {
      return { error: 'Error al eliminar ejercicio' }
    }
  }

  return {
    exercises,
    loading,
    error,
    loadExercises,
    createExercise,
    updateExercise,
    deleteExercise,
  }
}
