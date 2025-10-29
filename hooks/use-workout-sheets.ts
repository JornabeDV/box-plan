import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'

interface WorkoutSheetCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WorkoutSheet {
  id: string
  title: string
  description: string | null
  category_id: string
  plan_required: 'basic' | 'pro' | 'elite'
  template_data: any
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  workout_sheet_categories?: WorkoutSheetCategory
}

interface UserWorkoutSheet {
  id: string
  user_id: string
  sheet_id: string
  data: any
  completed_at: string | null
  created_at: string
  updated_at: string
  workout_sheets?: WorkoutSheet
}

interface WorkoutSheetsState {
  categories: WorkoutSheetCategory[]
  sheets: WorkoutSheet[]
  userSheets: UserWorkoutSheet[]
  loading: boolean
  error: string | null
}

export function useWorkoutSheets() {
  const [state, setState] = useState<WorkoutSheetsState>({
    categories: [],
    sheets: [],
    userSheets: [],
    loading: true,
    error: null
  })

  // Cargar categorías
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/workout-sheet-categories')
      
      if (!response.ok) throw new Error('Error loading categories')
      
      const data = await response.json()
      setState(prev => ({ ...prev, categories: data || [] }))
    } catch (error) {
      console.error('Error loading categories:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error al cargar categorías' 
      }))
    }
  }

  // Cargar planillas disponibles
  const loadSheets = async () => {
    try {
      const response = await fetch('/api/workout-sheets/public')
      
      if (!response.ok) throw new Error('Error loading sheets')
      
      const data = await response.json()
      setState(prev => ({ ...prev, sheets: data || [] }))
    } catch (error) {
      console.error('Error loading sheets:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error al cargar planillas' 
      }))
    }
  }

  // Cargar planillas del usuario
  const loadUserSheets = async () => {
    try {
      const response = await fetch('/api/user-workout-sheets')
      
      if (!response.ok) throw new Error('Error loading user sheets')
      
      const data = await response.json()
      setState(prev => ({ ...prev, userSheets: data || [] }))
    } catch (error) {
      console.error('Error loading user sheets:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error al cargar planillas del usuario' 
      }))
    }
  }

  // Crear nueva planilla del usuario
  const createUserSheet = async (sheetId: string, initialData: any = {}) => {
    try {
      const response = await fetch('/api/user-workout-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet_id: sheetId,
          data: initialData
        })
      })

      if (!response.ok) throw new Error('Error creating user sheet')

      const data = await response.json()

      setState(prev => ({
        ...prev,
        userSheets: [data, ...prev.userSheets]
      }))

      toast({
        title: "Planilla creada",
        description: "Tu planilla de entrenamiento ha sido creada exitosamente",
      })

      return data
    } catch (error) {
      console.error('Error creating user sheet:', error)
      toast({
        title: "Error al crear planilla",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
      throw error
    }
  }

  // Actualizar planilla del usuario
  const updateUserSheet = async (userSheetId: string, data: any) => {
    try {
      const response = await fetch(`/api/user-workout-sheets/${userSheetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      })

      if (!response.ok) throw new Error('Error updating user sheet')

      setState(prev => ({
        ...prev,
        userSheets: prev.userSheets.map(sheet => 
          sheet.id === userSheetId 
            ? { ...sheet, data, updated_at: new Date().toISOString() }
            : sheet
        )
      }))

      toast({
        title: "Planilla actualizada",
        description: "Los cambios han sido guardados exitosamente",
      })
    } catch (error) {
      console.error('Error updating user sheet:', error)
      toast({
        title: "Error al actualizar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
      throw error
    }
  }

  // Marcar planilla como completada
  const completeUserSheet = async (userSheetId: string) => {
    try {
      const response = await fetch(`/api/user-workout-sheets/${userSheetId}/complete`, {
        method: 'PATCH'
      })

      if (!response.ok) throw new Error('Error completing user sheet')

      setState(prev => ({
        ...prev,
        userSheets: prev.userSheets.map(sheet => 
          sheet.id === userSheetId 
            ? { 
                ...sheet, 
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            : sheet
        )
      }))

      toast({
        title: "Planilla completada",
        description: "¡Felicitaciones por completar tu planilla!",
      })
    } catch (error) {
      console.error('Error completing user sheet:', error)
      toast({
        title: "Error al completar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
      throw error
    }
  }

  // Eliminar planilla del usuario
  const deleteUserSheet = async (userSheetId: string) => {
    try {
      const response = await fetch(`/api/user-workout-sheets/${userSheetId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error deleting user sheet')

      setState(prev => ({
        ...prev,
        userSheets: prev.userSheets.filter(sheet => sheet.id !== userSheetId)
      }))

      toast({
        title: "Planilla eliminada",
        description: "La planilla ha sido eliminada exitosamente",
      })
    } catch (error) {
      console.error('Error deleting user sheet:', error)
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
      throw error
    }
  }

  // Filtrar planillas por plan de suscripción
  const getSheetsByPlan = (userPlan: 'basic' | 'pro' | 'elite' | null) => {
    if (!userPlan) return []
    
    const planOrder = { 'basic': 1, 'pro': 2, 'elite': 3 }
    const userPlanLevel = planOrder[userPlan]
    
    return state.sheets.filter(sheet => {
      const sheetPlanLevel = planOrder[sheet.plan_required]
      return sheetPlanLevel <= userPlanLevel
    })
  }

  // Cargar todos los datos
  const loadAllData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    await Promise.all([
      loadCategories(),
      loadSheets(),
      loadUserSheets()
    ])
    setState(prev => ({ ...prev, loading: false }))
  }

  useEffect(() => {
    loadAllData()
  }, [])

  return {
    ...state,
    createUserSheet,
    updateUserSheet,
    completeUserSheet,
    deleteUserSheet,
    getSheetsByPlan,
    loadAllData
  }
}