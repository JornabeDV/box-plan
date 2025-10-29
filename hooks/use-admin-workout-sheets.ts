import { useState, useEffect } from 'react'

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
      const response = await fetch(`/api/admin/workout-sheets?adminId=${adminId}`)
      
      if (!response.ok) {
        throw new Error('Error loading workout sheets')
      }

      const data = await response.json()
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
      const response = await fetch('/api/workout-sheet-categories')
      
      if (!response.ok) {
        console.error('Error loading categories')
        return
      }

      const data = await response.json()
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
    if (!adminId) {
      return { error: 'No admin ID provided' }
    }

    try {
      const response = await fetch('/api/admin/workout-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetData)
      })

      if (!response.ok) {
        throw new Error('Error creating workout sheet')
      }

      const { data, error } = await response.json()

      if (error) {
        return { error }
      }

      setWorkoutSheets(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      console.error('createWorkoutSheet: Exception:', err)
      return { error: 'Error creating workout sheet' }
    }
  }

  const updateWorkoutSheet = async (id: string, updates: Partial<WorkoutSheet>) => {
    try {
      const response = await fetch(`/api/admin/workout-sheets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Error updating workout sheet')
      }

      const { data, error } = await response.json()

      if (error) {
        return { error }
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
      const response = await fetch(`/api/admin/workout-sheets/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error deleting workout sheet')
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
      const response = await fetch(`/api/admin/workout-sheets?adminId=${adminId}&q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        console.error('Error searching workout sheets')
        return
      }

      const data = await response.json()
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