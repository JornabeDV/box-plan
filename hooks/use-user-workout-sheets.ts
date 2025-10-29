"use client"

import { useState, useEffect } from 'react'

interface WorkoutSheetCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string
}

interface WorkoutSheet {
  id: string
  title: string
  description: string | null
  category_id: string
  plan_required: string
  template_data: any
  is_active: boolean
  is_public: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
  estimated_duration?: number | null
  category?: WorkoutSheetCategory | null
}

interface AdminProfile {
  id: string
  name: string
  organization_name: string | null
  organization_type: string | null
}

interface WorkoutSheetAssignment {
  id: string
  user_id: string
  sheet_id: string
  admin_id: string
  assigned_at: string
  completed_at: string | null
  is_completed: boolean
  user_notes: string | null
  due_date?: string | null
  admin_feedback?: string | null
  created_at: string
  updated_at: string
  workout_sheet: WorkoutSheet
  admin: AdminProfile
}

export function useUserWorkoutSheets(userId: string | null) {
  const [assignedSheets, setAssignedSheets] = useState<WorkoutSheetAssignment[]>([])
  const [publicSheets, setPublicSheets] = useState<WorkoutSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    loadUserWorkoutSheets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadUserWorkoutSheets = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Cargar planillas asignadas y públicas en paralelo
      const [assignedResponse, publicResponse] = await Promise.all([
        fetch(`/api/workout-sheets/assigned?userId=${userId}`),
        fetch('/api/workout-sheets/public')
      ])

      // Si assignedResponse falla, intentar parsear el error
      if (!assignedResponse.ok) {
        let errorMessage = 'Error loading assigned workout sheets'
        try {
          const errorData = await assignedResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Si no se puede parsear, usar el mensaje por defecto
        }
        // No lanzar error si es 404 (no hay planillas asignadas)
        if (assignedResponse.status !== 404) {
          throw new Error(errorMessage)
        }
      }

      if (!publicResponse.ok) {
        let errorMessage = 'Error loading public workout sheets'
        try {
          const errorData = await publicResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Si no se puede parsear, usar el mensaje por defecto
        }
        // No lanzar error si es 404 (no hay planillas públicas)
        if (publicResponse.status !== 404) {
          throw new Error(errorMessage)
        }
      }

      // Parsear respuestas
      let assignedData: any = []
      let publicData: any = []

      if (assignedResponse.ok) {
        try {
          assignedData = await assignedResponse.json()
        } catch (parseError) {
          console.warn('Error parsing assigned response:', parseError)
          assignedData = []
        }
      }

      if (publicResponse.ok) {
        try {
          publicData = await publicResponse.json()
        } catch (parseError) {
          console.warn('Error parsing public response:', parseError)
          publicData = []
        }
      }

      setAssignedSheets(Array.isArray(assignedData) ? assignedData : [])
      setPublicSheets(Array.isArray(publicData) ? publicData : [])

    } catch (err) {
      // Solo loguear errores reales, pero no bloquear la UI
      console.error('Error loading user workout sheets:', err)
      
      // Si es un error de red o conexión, establecer error
      // Si es un error de datos faltantes, solo usar arrays vacíos
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Error de conexión. Verifica tu internet.')
      } else {
        // Para otros errores, solo loguear pero no establecer error crítico
        // Dejar arrays vacíos para que la UI funcione
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const markAsCompleted = async (assignmentId: string, userNotes?: string) => {
    try {
      const response = await fetch(`/api/workout-sheets/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_completed: true,
          completed_at: new Date().toISOString(),
          user_notes: userNotes
        })
      })

      if (!response.ok) {
        throw new Error('Error marking as completed')
      }

      // Recargar las planillas
      await loadUserWorkoutSheets()
      return { error: null }
    } catch (err) {
      console.error('Error marking as completed:', err)
      return { error: 'Error marking as completed' }
    }
  }

  const updateProgress = async (assignmentId: string, progressData: any, notes?: string) => {
    try {
      const assignment = assignedSheets.find(a => a.id === assignmentId)
      if (!assignment) {
        return { error: 'Assignment not found' }
      }

      const response = await fetch('/api/user-progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          workout_sheet_id: assignment.sheet_id,
          admin_id: assignment.admin_id,
          progress_data: progressData,
          notes: notes,
          completed_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Error updating progress')
      }

      return { error: null }
    } catch (err) {
      console.error('Error updating progress:', err)
      return { error: 'Error updating progress' }
    }
  }

  return {
    assignedSheets,
    publicSheets,
    loading,
    error,
    markAsCompleted,
    updateProgress,
    refresh: loadUserWorkoutSheets
  }
}