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
  }, [userId])

  const loadUserWorkoutSheets = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // Cargar planillas asignadas y públicas en paralelo
      const [assignedResponse, publicResponse] = await Promise.all([
        fetch(`/api/workout-sheets/assigned?userId=${userId}`),
        fetch('/api/workout-sheets/public')
      ])

      if (!assignedResponse.ok) {
        throw new Error('Error loading assigned workout sheets')
      }

      if (!publicResponse.ok) {
        throw new Error('Error loading public workout sheets')
      }

      const assignedData = await assignedResponse.json()
      const publicData = await publicResponse.json()

      setAssignedSheets(assignedData || [])
      setPublicSheets(publicData || [])

    } catch (err) {
      console.error('Error loading user workout sheets:', err)
      setError('Error loading workout sheets')
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