'use client'

import { useState, useEffect } from 'react'

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
      const response = await fetch(`/api/admin/users?adminId=${adminId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }

      const data = await response.json()
      setUsers(data || [])
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

      const response = await fetch(`/api/user-preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar preferencias')
      }

      const result = await response.json()

      // Actualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, preferences: result }
          : user
      ))

      return { data: result, error: null }
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

      const response = await fetch(`/api/user-preferences/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar preferencias')
      }

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