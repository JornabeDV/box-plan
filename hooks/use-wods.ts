import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type WOD = Database['public']['Tables']['wods']['Row']
type WODInsert = Database['public']['Tables']['wods']['Insert']
type WODUpdate = Database['public']['Tables']['wods']['Update']

export function useWODs() {
  const [wods, setWODs] = useState<WOD[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar todos los WODs
  const fetchWODs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('wods')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setWODs(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar WODs')
    } finally {
      setLoading(false)
    }
  }

  // Obtener WOD por ID
  const getWODById = async (id: string): Promise<WOD | null> => {
    try {
      const { data, error } = await supabase
        .from('wods')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar WOD')
      return null
    }
  }

  // Crear nuevo WOD
  const createWOD = async (wod: WODInsert): Promise<WOD | null> => {
    try {
      const { data, error } = await supabase
        .from('wods')
        .insert(wod)
        .select()
        .single()

      if (error) throw error
      
      // Actualizar la lista local
      setWODs(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear WOD')
      return null
    }
  }

  // Actualizar WOD
  const updateWOD = async (id: string, updates: WODUpdate): Promise<WOD | null> => {
    try {
      const { data, error } = await supabase
        .from('wods')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      // Actualizar la lista local
      setWODs(prev => prev.map(wod => wod.id === id ? data : wod))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar WOD')
      return null
    }
  }

  // Eliminar WOD
  const deleteWOD = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('wods')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Actualizar la lista local
      setWODs(prev => prev.filter(wod => wod.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar WOD')
      return false
    }
  }

  // Obtener WOD del día
  const getTodaysWOD = async (): Promise<WOD | null> => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('wods')
        .select('*')
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar WOD del día')
      return null
    }
  }

  useEffect(() => {
    fetchWODs()
  }, [])

  return {
    wods,
    loading,
    error,
    fetchWODs,
    getWODById,
    createWOD,
    updateWOD,
    deleteWOD,
    getTodaysWOD,
  }
}