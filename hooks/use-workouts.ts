import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Workout = Database['public']['Tables']['workouts']['Row']
type WorkoutInsert = Database['public']['Tables']['workouts']['Insert']
type WorkoutUpdate = Database['public']['Tables']['workouts']['Update']

export function useWorkouts(userId?: string) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar entrenamientos del usuario
  const fetchWorkouts = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          wods (
            id,
            name,
            type,
            difficulty
          )
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })

      if (error) throw error
      setWorkouts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar entrenamientos')
    } finally {
      setLoading(false)
    }
  }

  // Registrar nuevo entrenamiento
  const logWorkout = async (workout: Omit<WorkoutInsert, 'user_id'>): Promise<Workout | null> => {
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert({
          ...workout,
          user_id: userId,
        })
        .select(`
          *,
          wods (
            id,
            name,
            type,
            difficulty
          )
        `)
        .single()

      if (error) throw error
      
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
      const { data, error } = await supabase
        .from('workouts')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          wods (
            id,
            name,
            type,
            difficulty
          )
        `)
        .single()

      if (error) throw error
      
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
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
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
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('completed_at, duration_seconds')
        .eq('user_id', userId)

      if (error) throw error

      const stats = {
        totalWorkouts: data?.length || 0,
        thisWeek: data?.filter(w => {
          const workoutDate = new Date(w.completed_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return workoutDate >= weekAgo
        }).length || 0,
        thisMonth: data?.filter(w => {
          const workoutDate = new Date(w.completed_at)
          const monthAgo = new Date()
          monthAgo.setDate(monthAgo.getDate() - 30)
          return workoutDate >= monthAgo
        }).length || 0,
        averageDuration: data?.reduce((acc, w) => acc + (w.duration_seconds || 0), 0) / (data?.length || 1) || 0,
      }

      return stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
      return null
    }
  }

  // Obtener racha actual
  const getCurrentStreak = async (): Promise<number> => {
    if (!userId) return 0

    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) return 0

      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (const workout of data) {
        const workoutDate = new Date(workout.completed_at)
        workoutDate.setHours(0, 0, 0, 0)
        
        const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === streak) {
          streak++
        } else if (daysDiff === streak + 1) {
          // Permitir un día de diferencia (fin de semana, etc.)
          streak++
        } else {
          break
        }
      }

      return streak
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular racha')
      return 0
    }
  }

  useEffect(() => {
    if (userId) {
      fetchWorkouts()
    }
  }, [userId])

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
