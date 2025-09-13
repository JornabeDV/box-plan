import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
      const { data, error } = await supabase
        .from('workout_sheet_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (error) throw error
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
      const { data, error } = await supabase
        .from('workout_sheets')
        .select(`
          *,
          workout_sheet_categories (
            id,
            name,
            description,
            icon,
            color
          )
        `)
        .eq('is_active', true)
        .order('title', { ascending: true })

      if (error) throw error
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_workout_sheets')
        .select(`
          *,
          workout_sheets (
            id,
            title,
            description,
            plan_required,
            template_data,
            workout_sheet_categories (
              name,
              icon,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data, error } = await supabase
        .from('user_workout_sheets')
        .insert({
          user_id: user.id,
          sheet_id: sheetId,
          data: initialData
        })
        .select(`
          *,
          workout_sheets (
            id,
            title,
            description,
            plan_required,
            template_data,
            workout_sheet_categories (
              name,
              icon,
              color
            )
          )
        `)
        .single()

      if (error) throw error

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
      const { error } = await supabase
        .from('user_workout_sheets')
        .update({ 
          data,
          updated_at: new Date().toISOString()
        })
        .eq('id', userSheetId)

      if (error) throw error

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
      const { error } = await supabase
        .from('user_workout_sheets')
        .update({ 
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userSheetId)

      if (error) throw error

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
      const { error } = await supabase
        .from('user_workout_sheets')
        .delete()
        .eq('id', userSheetId)

      if (error) throw error

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