"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type WorkoutSheet = Database['public']['Tables']['workout_sheets']['Row'] & {
  category: Database['public']['Tables']['workout_sheet_categories']['Row'] | null
}

type WorkoutSheetAssignment = Database['public']['Tables']['workout_sheet_assignments']['Row'] & {
  workout_sheet: WorkoutSheet
  admin: Database['public']['Tables']['admin_profiles']['Row']
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

      // Cargar planillas asignadas
      const { data: assignedData, error: assignedError } = await supabase
        .from('workout_sheet_assignments')
        .select(`
          *,
          workout_sheet:workout_sheets(
            *,
            category:workout_sheet_categories(
              id,
              name,
              description,
              icon,
              color
            )
          ),
          admin:admin_profiles(
            id,
            name,
            organization_name,
            organization_type
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })

      if (assignedError) {
        console.error('Error loading assigned workout sheets:', assignedError)
        setError(assignedError.message)
        return
      }

      setAssignedSheets(assignedData || [])

      // Cargar planillas públicas
      const { data: publicData, error: publicError } = await supabase
        .from('workout_sheets')
        .select(`
          *,
          category:workout_sheet_categories(
            id,
            name,
            description,
            icon,
            color
          )
        `)
        .eq('is_public', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (publicError) {
        console.error('Error loading public workout sheets:', publicError)
        setError(publicError.message)
        return
      }

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
      const { error } = await supabase
        .from('workout_sheet_assignments')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          user_notes: userNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (error) {
        console.error('Error marking as completed:', error)
        return { error: error.message }
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
      // Crear o actualizar el progreso del usuario
      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId!,
          workout_sheet_id: assignedSheets.find(a => a.id === assignmentId)?.workout_sheet_id,
          admin_id: assignedSheets.find(a => a.id === assignmentId)?.admin_id,
          progress_data: progressData,
          notes: notes,
          completed_at: new Date().toISOString()
        })

      if (progressError) {
        console.error('Error updating progress:', progressError)
        return { error: progressError.message }
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