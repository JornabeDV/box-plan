import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface WorkoutSheet {
  id: string
  admin_id: string | null
  category_id: string | null
  title: string
  description: string | null
  content: any
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  estimated_duration: number | null
  equipment_needed: string[]
  tags: string[]
  is_template: boolean
  is_public: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    description: string | null
    icon: string | null
  }
}

export interface WorkoutSheetCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
  created_at: string
}

export function useAdminWorkoutSheets(adminId: string | null) {
  const [workoutSheets, setWorkoutSheets] = useState<WorkoutSheet[]>([])
  const [categories, setCategories] = useState<WorkoutSheetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (adminId) {
      loadWorkoutSheets()
      loadCategories()
    }
  }, [adminId])

  const loadWorkoutSheets = async () => {
    if (!adminId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('workout_sheets')
        .select(`
          *,
          category:workout_sheet_categories(
            id,
            name,
            description,
            icon
          )
        `)
        .eq('admin_id', adminId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading workout sheets:', error)
        setError('Error loading workout sheets')
        return
      }

      setWorkoutSheets(data || [])
    } catch (err) {
      console.error('Error loading workout sheets:', err)
      setError('Error loading workout sheets')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_sheet_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error loading categories:', error)
        return
      }

      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const createWorkoutSheet = async (sheetData: {
    category_id: string
    title: string
    description?: string
    content: any
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    estimated_duration?: number
    equipment_needed?: string[]
    tags?: string[]
    is_template?: boolean
    is_public?: boolean
  }) => {
    console.log('createWorkoutSheet: Starting with adminId:', adminId)
    console.log('createWorkoutSheet: Sheet data:', sheetData)
    
    if (!adminId) {
      console.error('createWorkoutSheet: No admin ID provided')
      return { error: 'No admin ID provided' }
    }

    try {
      console.log('createWorkoutSheet: Inserting into database...')
      
      const { data, error } = await supabase
        .from('workout_sheets')
        .insert({
          admin_id: adminId,
          category_id: sheetData.category_id,
          title: sheetData.title,
          description: sheetData.description,
          content: sheetData.content,
          difficulty: sheetData.difficulty,
          estimated_duration: sheetData.estimated_duration,
          equipment_needed: sheetData.equipment_needed || [],
          tags: sheetData.tags || [],
          is_template: sheetData.is_template || false,
          is_public: sheetData.is_public || false,
          plan_required: null,
          template_data: {},
          is_active: true
        })
        .select(`
          *,
          category:workout_sheet_categories(
            id,
            name,
            description,
            icon
          )
        `)
        .single()

      console.log('createWorkoutSheet: Database response:', { data, error })

      if (error) {
        console.error('createWorkoutSheet: Database error:', error)
        return { error: error.message }
      }

      console.log('createWorkoutSheet: Success! Updating state...')
      setWorkoutSheets(prev => [data, ...prev])
      console.log('createWorkoutSheet: State updated, returning success')
      return { data, error: null }
    } catch (err) {
      console.error('createWorkoutSheet: Exception:', err)
      return { error: 'Error creating workout sheet' }
    }
  }

  const updateWorkoutSheet = async (id: string, updates: Partial<WorkoutSheet>) => {
    try {
      const { data, error } = await supabase
        .from('workout_sheets')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:workout_sheet_categories(
            id,
            name,
            description,
            icon
          )
        `)
        .single()

      if (error) {
        console.error('Error updating workout sheet:', error)
        return { error: error.message }
      }

      setWorkoutSheets(prev => 
        prev.map(sheet => sheet.id === id ? data : sheet)
      )
      return { data, error: null }
    } catch (err) {
      console.error('Error updating workout sheet:', err)
      return { error: 'Error updating workout sheet' }
    }
  }

  const deleteWorkoutSheet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workout_sheets')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        console.error('Error deleting workout sheet:', error)
        return { error: error.message }
      }

      setWorkoutSheets(prev => prev.filter(sheet => sheet.id !== id))
      return { error: null }
    } catch (err) {
      console.error('Error deleting workout sheet:', err)
      return { error: 'Error deleting workout sheet' }
    }
  }

  const searchWorkoutSheets = async (query: string) => {
    if (!adminId) return

    try {
      const { data, error } = await supabase
        .from('workout_sheets')
        .select(`
          *,
          category:workout_sheet_categories(
            id,
            name,
            description,
            icon
          )
        `)
        .eq('admin_id', adminId)
        .eq('is_active', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching workout sheets:', error)
        return
      }

      setWorkoutSheets(data || [])
    } catch (err) {
      console.error('Error searching workout sheets:', err)
    }
  }

  return {
    workoutSheets,
    categories,
    loading,
    error,
    createWorkoutSheet,
    updateWorkoutSheet,
    deleteWorkoutSheet,
    searchWorkoutSheets,
    loadWorkoutSheets
  }
}