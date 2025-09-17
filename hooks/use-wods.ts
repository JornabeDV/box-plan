"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface WOD {
  id: string
  name: string
  description: string
  type: 'metcon' | 'strength' | 'skill' | 'endurance'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes?: number
  exercises: Array<{
    name: string
    weight?: string
    reps?: string
    sets?: string
    notes?: string
  }>
  instructions?: string
  scaling?: string
  tips?: string[]
  is_public: boolean
  is_template: boolean
  date?: string
  admin_id: string
  created_at: string
  updated_at: string
}

export function useWODs(adminId?: string) {
  const [wods, setWODs] = useState<WOD[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar WODs desde la base de datos
  const loadWODs = async () => {
    if (!adminId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('wods')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error loading WODs:', fetchError)
        setError(fetchError.message)
        return
      }

      setWODs(data || [])
    } catch (err) {
      console.error('Error in loadWODs:', err)
      setError('Error al cargar WODs')
    } finally {
      setLoading(false)
    }
  }

  // Crear nuevo WOD
  const createWOD = async (wodData: Omit<WOD, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null)
      
      // Limpiar los datos eliminando campos undefined y null
      const cleanData: any = {
        ...wodData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Eliminar campos undefined y null, excepto los que pueden ser null en la DB
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
          delete cleanData[key]
        }
      })
      
      // Asegurar que exercises y tips sean arrays válidos
      if (!Array.isArray(cleanData.exercises)) {
        cleanData.exercises = []
      }
      if (!Array.isArray(cleanData.tips)) {
        cleanData.tips = []
      }
      
      const { data, error: insertError } = await supabase
        .from('wods')
        .insert([cleanData])
        .select()
        .single()

      if (insertError) {
        console.error('Error creating WOD:', insertError)
        setError(insertError.message)
        return { error: insertError.message }
      }

      // Agregar el nuevo WOD al estado local
      setWODs(prev => [data, ...prev])
      return { error: null, data }
    } catch (err) {
      console.error('Error in createWOD:', err)
      setError('Error al crear WOD')
      return { error: 'Error al crear WOD' }
    }
  }

  // Actualizar WOD
  const updateWOD = async (id: string, updates: Partial<WOD>) => {
    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from('wods')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating WOD:', updateError)
        setError(updateError.message)
        return { error: updateError.message }
      }

      // Actualizar el WOD en el estado local
      setWODs(prev => prev.map(wod => wod.id === id ? data : wod))
      return { error: null, data }
    } catch (err) {
      console.error('Error in updateWOD:', err)
      setError('Error al actualizar WOD')
      return { error: 'Error al actualizar WOD' }
    }
  }

  // Eliminar WOD
  const deleteWOD = async (id: string) => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('wods')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting WOD:', deleteError)
        setError(deleteError.message)
        return { error: deleteError.message }
      }

      // Eliminar el WOD del estado local
      setWODs(prev => prev.filter(wod => wod.id !== id))
      return { error: null }
    } catch (err) {
      console.error('Error in deleteWOD:', err)
      setError('Error al eliminar WOD')
      return { error: 'Error al eliminar WOD' }
    }
  }

  // Buscar WODs
  const searchWODs = async (query: string) => {
    if (!adminId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: searchError } = await supabase
        .from('wods')
        .select('*')
        .eq('admin_id', adminId)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (searchError) {
        console.error('Error searching WODs:', searchError)
        setError(searchError.message)
        return
      }

      setWODs(data || [])
    } catch (err) {
      console.error('Error in searchWODs:', err)
      setError('Error al buscar WODs')
    } finally {
      setLoading(false)
    }
  }

  // Cargar WODs al montar el componente
  useEffect(() => {
    loadWODs()
  }, [adminId])

  return {
    wods,
    loading,
    error,
    createWOD,
    updateWOD,
    deleteWOD,
    searchWODs,
    refresh: loadWODs
  }
}