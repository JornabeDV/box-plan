'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// Definir tipos manualmente ya que no usamos Database de Supabase
interface WorkoutSheetBasic {
  id: string
  title: string
  difficulty: string
}

interface Workout {
  id: string
  user_id: string
  sheet_id: string
  data: any
  completed_at: string
  duration_seconds: number | null
  created_at: string
  updated_at: string
  workout_sheets?: WorkoutSheetBasic | null
}

interface WorkoutInsert {
  sheet_id: string
  data: any
  completed_at: string
  duration_seconds?: number | null
}

interface WorkoutUpdate {
  data?: any
  completed_at?: string
  duration_seconds?: number | null
}

export function useWorkouts(userId?: string) {
  const { data: session } = useSession()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const actualUserId = userId || session?.user?.id

  // Cargar entrenamientos del usuario
  const fetchWorkouts = async () => {
    if (!actualUserId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/workouts?userId=${actualUserId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar entrenamientos')
      }

      const data = await response.json()
      setWorkouts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar entrenamientos')
    } finally {
      setLoading(false)
    }
  }

  // Registrar nuevo entrenamiento
  const logWorkout = async (workout: WorkoutInsert): Promise<Workout | null> => {
    if (!actualUserId) return null

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...workout,
          user_id: actualUserId,
        })
      })

      if (!response.ok) {
        throw new Error('Error al registrar entrenamiento')
      }

      const data = await response.json()
      
      // Actualizar la lista local
      setWorkouts(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar entrenamiento')
      return null
    }
  }

  // Actualizar entrenamiento
  const updateWorkout = async (id: string, updates: WorkoutUpdate): Promise<Workout | null> => {
    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar entrenamiento')
      }

      const data = await response.json()
      
      // Actualizar la lista local
      setWorkouts(prev => prev.map(workout => workout.id === id ? data : workout))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar entrenamiento')
      return null
    }
  }

  // Eliminar entrenamiento
  const deleteWorkout = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar entrenamiento')
      }
      
      // Actualizar la lista local
      setWorkouts(prev => prev.filter(workout => workout.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar entrenamiento')
      return false
    }
  }

  // Obtener estadísticas del usuario
  const getUserStats = async () => {
    if (!actualUserId) return null

    try {
      const response = await fetch(`/api/workouts/stats?userId=${actualUserId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }

      const stats = await response.json()
      return stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
      return null
    }
  }

  // Obtener racha actual
  const getCurrentStreak = async (): Promise<number> => {
    if (!actualUserId) return 0

    try {
      const stats = await getUserStats()
      return stats?.streak || 0
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular racha')
      return 0
    }
  }

  useEffect(() => {
    if (actualUserId) {
      fetchWorkouts()
    }
  }, [actualUserId])

  return {
    workouts,
    loading,
    error,
    fetchWorkouts,
    logWorkout,
    updateWorkout,
    deleteWorkout,
    getUserStats,
    getCurrentStreak,
  }
}