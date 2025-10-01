'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserPreference {
  id: string
  user_id: string
  preferred_discipline_id: string | null
  preferred_level_id: string | null
  created_at: string
  updated_at: string
  discipline?: {
    id: string
    name: string
    color: string
  }
  level?: {
    id: string
    name: string
    description: string | null
  }
}

export interface UserWithPreferences {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  preferences?: UserPreference
}

export interface UpdateUserPreferenceData {
  preferred_discipline_id: string | null
  preferred_level_id: string | null
}

export function useUserPreferences(adminId: string | null) {
  const [users, setUsers] = useState<UserWithPreferences[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar usuarios con sus preferencias
  const fetchUsers = async () => {
    if (!adminId) return

    setLoading(true)
    setError(null)

    try {
      // Obtener IDs de usuarios asignados al admin
      const { data: assignments, error: assignmentsError } = await supabase
        .from('admin_user_assignments')
        .select('user_id')
        .eq('admin_id', adminId)
        .eq('is_active', true)

      if (assignmentsError) throw assignmentsError

      if (!assignments || assignments.length === 0) {
        setUsers([])
        return
      }

      // Obtener IDs de usuarios
      const userIds = assignments.map(a => a.user_id)

      // Obtener datos de usuarios y preferencias en paralelo
      const [usersResult, preferencesResult] = await Promise.all([
        // Obtener datos de usuarios desde profiles
        supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)
          .order('created_at', { ascending: false }),
        
        // Obtener preferencias de usuarios
        supabase
          .from('user_preferences')
          .select(`
            *,
            discipline:disciplines(id, name, color),
            level:discipline_levels(id, name, description)
          `)
          .in('user_id', userIds)
      ])

      if (usersResult.error) throw usersResult.error
      if (preferencesResult.error) throw preferencesResult.error

      // Combinar usuarios con sus preferencias
      const usersWithPreferences: UserWithPreferences[] = (usersResult.data || []).map(user => {
        const userPreference = preferencesResult.data?.find(p => p.user_id === user.id)
        
        return {
          ...user,
          preferences: userPreference || undefined
        }
      })

      setUsers(usersWithPreferences)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  // Actualizar preferencias de usuario
  const updateUserPreferences = async (userId: string, data: UpdateUserPreferenceData) => {
    try {
      setError(null)

      // Verificar si ya existen preferencias
      const { data: existingPreferences, error: fetchError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      let result
      if (existingPreferences) {
        // Actualizar preferencias existentes
        result = await supabase
          .from('user_preferences')
          .update({
            preferred_discipline_id: data.preferred_discipline_id,
            preferred_level_id: data.preferred_level_id,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select(`
            *,
            discipline:disciplines(id, name, color),
            level:discipline_levels(id, name, description)
          `)
          .single()
      } else {
        // Crear nuevas preferencias
        result = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            preferred_discipline_id: data.preferred_discipline_id,
            preferred_level_id: data.preferred_level_id
          })
          .select(`
            *,
            discipline:disciplines(id, name, color),
            level:discipline_levels(id, name, description)
          `)
          .single()
      }

      if (result.error) throw result.error

      // Actualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, preferences: result.data }
          : user
      ))

      return { data: result.data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar preferencias'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Eliminar preferencias de usuario
  const deleteUserPreferences = async (userId: string) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      // Actualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, preferences: undefined }
          : user
      ))

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar preferencias'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers()
  }, [adminId])

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUserPreferences,
    deleteUserPreferences
  }
}
