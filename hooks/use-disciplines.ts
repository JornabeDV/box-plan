'use client'

import { useState, useEffect } from 'react'

export interface Discipline {
  id: string
  name: string
  description?: string
  color: string
  order_index: number
  is_active: boolean
  coach_id: string
  created_at: string
  updated_at: string
  levels?: DisciplineLevel[]
}

export interface DisciplineLevel {
  id: string
  discipline_id: string
  name: string
  description?: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateDisciplineData {
  name: string
  description?: string
  color?: string
  order_index?: number
}

export interface CreateDisciplineLevelData {
  discipline_id: string
  name: string
  description?: string
  order_index?: number
}

export interface UpdateDisciplineData extends Partial<CreateDisciplineData> {
  id: string
}

export interface UpdateDisciplineLevelData extends Partial<CreateDisciplineLevelData> {
  id: string
}

export function useDisciplines(coachId: string | null) {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [disciplineLevels, setDisciplineLevels] = useState<DisciplineLevel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar disciplinas con sus niveles
  const fetchDisciplines = async () => {
    if (!coachId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/disciplines?coachId=${coachId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar disciplinas')
      }

      const data = await response.json()
      
      setDisciplines(data.disciplines || [])
      setDisciplineLevels(data.levels || [])
    } catch (err) {
      console.error('Error fetching disciplines:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar disciplinas')
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva disciplina
  const createDiscipline = async (data: CreateDisciplineData & { levels?: any[] }) => {
    if (!coachId) {
      return { error: 'Coach ID requerido' }
    }

    try {
      const response = await fetch('/api/disciplines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          color: data.color || '#3B82F6',
          coach_id: coachId,
          order_index: data.order_index ?? disciplines.length,
          levels: data.levels || []
        })
      })

      if (!response.ok) {
        throw new Error('Error al crear disciplina')
      }

      const newDiscipline = await response.json()

      // Recargar todas las disciplinas para asegurar sincronización
      await fetchDisciplines()
      
      return { data: newDiscipline }
    } catch (err) {
      console.error('Error creating discipline:', err)
      return { error: err instanceof Error ? err.message : 'Error al crear disciplina' }
    }
  }

  // Actualizar disciplina
  const updateDiscipline = async (data: UpdateDisciplineData & { levels?: any[] }) => {
    try {
      const response = await fetch(`/api/disciplines/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          color: data.color,
          order_index: data.order_index ?? 0,
          levels: data.levels
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        const errorMessage = responseData.error || 'Error al actualizar disciplina'
        throw new Error(errorMessage)
      }

      const updatedDiscipline = responseData

      // Recargar todas las disciplinas para asegurar sincronización (especialmente niveles)
      await fetchDisciplines()
      
      return { data: updatedDiscipline }
    } catch (err) {
      console.error('Error updating discipline:', err)
      return { error: err instanceof Error ? err.message : 'Error al actualizar disciplina' }
    }
  }

  // Eliminar disciplina (soft delete)
  const deleteDiscipline = async (id: string) => {
    try {
      const response = await fetch(`/api/disciplines/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar disciplina')
      }

      setDisciplines(prev => prev.filter(d => d.id !== id))
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting discipline:', err)
      return { error: err instanceof Error ? err.message : 'Error al eliminar disciplina' }
    }
  }

  // Crear nuevo nivel de disciplina
  const createDisciplineLevel = async (data: CreateDisciplineLevelData) => {
    try {
      const response = await fetch('/api/disciplines/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Error al crear nivel')

      const newLevel = await response.json()

      setDisciplines(prev => 
        prev.map(d => 
          d.id === data.discipline_id 
            ? { ...d, levels: [...(d.levels || []), newLevel] }
            : d
        )
      )
      return { data: newLevel }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al crear nivel' }
    }
  }

  // Actualizar nivel de disciplina
  const updateDisciplineLevel = async (data: UpdateDisciplineLevelData) => {
    try {
      const response = await fetch(`/api/disciplines/levels/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Error al actualizar nivel')

      const updatedLevel = await response.json()

      setDisciplines(prev => 
        prev.map(d => 
          d.id === updatedLevel.discipline_id
            ? { 
                ...d, 
                levels: d.levels?.map(l => l.id === data.id ? updatedLevel : l) || []
              }
            : d
        )
      )
      return { data: updatedLevel }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al actualizar nivel' }
    }
  }

  // Eliminar nivel de disciplina (soft delete)
  const deleteDisciplineLevel = async (id: string) => {
    try {
      const response = await fetch(`/api/disciplines/levels/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar nivel')

      setDisciplines(prev => 
        prev.map(d => ({
          ...d,
          levels: d.levels?.filter(l => l.id !== id) || []
        }))
      )
      return { success: true }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al eliminar nivel' }
    }
  }

  // Reordenar disciplinas
  const reorderDisciplines = async (disciplineIds: string[]) => {
    try {
      const response = await fetch('/api/disciplines/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplineIds })
      })

      if (!response.ok) throw new Error('Error al reordenar disciplinas')

      setDisciplines(prev => {
        const reordered = disciplineIds.map(id => 
          prev.find(d => d.id === id)!
        ).filter(Boolean)
        return reordered
      })

      return { success: true }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al reordenar disciplinas' }
    }
  }

  // Reordenar niveles de una disciplina
  const reorderDisciplineLevels = async (disciplineId: string, levelIds: string[]) => {
    try {
      const response = await fetch('/api/disciplines/levels/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelIds })
      })

      if (!response.ok) throw new Error('Error al reordenar niveles')

      setDisciplines(prev => 
        prev.map(d => 
          d.id === disciplineId
            ? {
                ...d,
                levels: levelIds.map(id => d.levels?.find(l => l.id === id)!).filter(Boolean)
              }
            : d
        )
      )

      return { success: true }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al reordenar niveles' }
    }
  }

  useEffect(() => {
    fetchDisciplines()
  }, [coachId])

  return {
    disciplines,
    disciplineLevels,
    loading,
    error,
    fetchDisciplines,
    createDiscipline,
    updateDiscipline,
    deleteDiscipline,
    createDisciplineLevel,
    updateDisciplineLevel,
    deleteDisciplineLevel,
    reorderDisciplines,
    reorderDisciplineLevels
  }
}