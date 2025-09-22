'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Discipline {
  id: string
  name: string
  description?: string
  color: string
  order_index: number
  is_active: boolean
  admin_id: string
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

export function useDisciplines(adminId: string | null) {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [disciplineLevels, setDisciplineLevels] = useState<DisciplineLevel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar disciplinas con sus niveles
  const fetchDisciplines = async () => {
    if (!adminId) return

    setLoading(true)
    setError(null)

    try {
      // Primero cargar las disciplinas
      const { data: disciplinesData, error: disciplinesError } = await supabase
        .from('disciplines')
        .select('*')
        .eq('admin_id', adminId)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (disciplinesError) throw disciplinesError

      if (!disciplinesData || disciplinesData.length === 0) {
        setDisciplines([])
        return
      }

      // Luego cargar los niveles para cada disciplina
      const disciplineIds = disciplinesData.map(d => d.id)
      const { data: levelsData, error: levelsError } = await supabase
        .from('discipline_levels')
        .select('*')
        .in('discipline_id', disciplineIds)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (levelsError) throw levelsError

      // Combinar disciplinas con sus niveles
      const transformedData = disciplinesData.map(discipline => ({
        ...discipline,
        levels: (levelsData || []).filter(level => level.discipline_id === discipline.id)
      }))

      setDisciplines(transformedData)
      setDisciplineLevels(levelsData || [])
    } catch (err) {
      console.error('Error fetching disciplines:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar disciplinas')
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva disciplina
  const createDiscipline = async (data: CreateDisciplineData & { levels?: any[] }) => {
    if (!adminId) {
      return { error: 'Admin ID requerido' }
    }

    try {
      // Crear la disciplina
      const { data: newDiscipline, error: disciplineError } = await supabase
        .from('disciplines')
        .insert({
          name: data.name,
          description: data.description,
          color: data.color || '#3B82F6',
          admin_id: adminId,
          order_index: data.order_index ?? disciplines.length
        })
        .select()
        .single()

      if (disciplineError) {
        console.error('Error creating discipline:', disciplineError)
        throw disciplineError
      }

      // Crear los niveles si existen
      let levels = []
      if (data.levels && data.levels.length > 0) {
        const { data: newLevels, error: levelsError } = await supabase
          .from('discipline_levels')
          .insert(
            data.levels.map((level) => ({
              discipline_id: newDiscipline.id,
              name: level.name,
              description: level.description,
              order_index: level.order_index
            }))
          )
          .select()

        if (levelsError) {
          console.error('Error creating levels:', levelsError)
          throw levelsError
        }
        levels = newLevels || []
      }

      // Actualizar estado local
      const disciplineWithLevels = { ...newDiscipline, levels }
      setDisciplines(prev => [...prev, disciplineWithLevels])
      
      return { data: newDiscipline }
    } catch (err) {
      console.error('Error creating discipline:', err)
      return { error: err instanceof Error ? err.message : 'Error al crear disciplina' }
    }
  }

  // Actualizar disciplina
  const updateDiscipline = async (data: UpdateDisciplineData & { levels?: any[] }) => {
    try {
      // Timeout más generoso para operaciones complejas
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La operación tardó demasiado')), 45000)
      })
      
      const updatePromise = async () => {
        // Paso 1: Actualizar la disciplina básica
        const { data: updatedDiscipline, error: disciplineError } = await supabase
          .from('disciplines')
          .update({
            name: data.name,
            description: data.description,
            color: data.color,
            order_index: data.order_index ?? 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .select()
          .single()

        if (disciplineError) {
          throw disciplineError
        }

        // Paso 2: Manejar niveles si se proporcionan
        let levels = []
        if (data.levels !== undefined) {
          // Filtrar niveles válidos (que tengan nombre)
          const validLevels = data.levels.filter(level => level.name?.trim())
          
          if (validLevels.length > 0) {
            // Obtener niveles existentes para comparar
            const { data: existingLevels, error: fetchError } = await supabase
              .from('discipline_levels')
              .select('*')
              .eq('discipline_id', data.id)
              .eq('is_active', true)
              .order('order_index', { ascending: true })

            if (fetchError) {
              throw fetchError
            }
            
            // Si no hay niveles existentes, simplemente crear los nuevos
            if (!existingLevels || existingLevels.length === 0) {
              const { data: newLevels, error: levelsError } = await supabase
                .from('discipline_levels')
                .insert(
                  validLevels.map((level) => ({
                    discipline_id: data.id,
                    name: level.name,
                    description: level.description,
                    order_index: level.order_index
                  }))
                )
                .select()

              if (levelsError) {
                throw levelsError
              }
              
              levels = newLevels || []
            } else {
              // Hay niveles existentes, usar enfoque más eficiente
              // Crear un mapa de niveles existentes por order_index para comparación
              const existingLevelsMap = new Map(existingLevels.map(level => [level.order_index, level]))
              
              // Procesar cada nivel nuevo
              const levelUpdates: any[] = []
              const levelInserts: any[] = []
              
              validLevels.forEach((newLevel, index) => {
                const existingLevel = existingLevelsMap.get(index)
                
                if (existingLevel) {
                  // Actualizar nivel existente si hay cambios
                  if (existingLevel.name !== newLevel.name || 
                      existingLevel.description !== newLevel.description ||
                      existingLevel.order_index !== newLevel.order_index) {
                    levelUpdates.push({
                      id: existingLevel.id,
                      name: newLevel.name,
                      description: newLevel.description,
                      order_index: newLevel.order_index,
                      updated_at: new Date().toISOString()
                    })
                  }
                } else {
                  // Crear nuevo nivel
                  levelInserts.push({
                    discipline_id: data.id,
                    name: newLevel.name,
                    description: newLevel.description,
                    order_index: newLevel.order_index
                  })
                }
              })
              
              // Desactivar niveles que ya no están en la nueva lista
              const levelsToDeactivate = existingLevels
                .filter(existing => existing.order_index >= validLevels.length)
                .map(level => level.id)
              
              // Ejecutar operaciones en paralelo para mejor rendimiento
              const operations = []
              
              // Actualizar niveles existentes uno por uno
              if (levelUpdates.length > 0) {
                levelUpdates.forEach(update => {
                  operations.push(
                    supabase
                      .from('discipline_levels')
                      .update({
                        name: update.name,
                        description: update.description,
                        order_index: update.order_index,
                        updated_at: update.updated_at
                      })
                      .eq('id', update.id)
                      .select()
                  )
                })
              }
              
              // Insertar nuevos niveles
              if (levelInserts.length > 0) {
                operations.push(
                  supabase
                    .from('discipline_levels')
                    .insert(levelInserts)
                    .select()
                )
              }
              
              // Desactivar niveles obsoletos
              if (levelsToDeactivate.length > 0) {
                operations.push(
                  supabase
                    .from('discipline_levels')
                    .update({ 
                      is_active: false, 
                      updated_at: new Date().toISOString() 
                    })
                    .in('id', levelsToDeactivate)
                )
              }
              
              // Ejecutar todas las operaciones en paralelo
              if (operations.length > 0) {
                const results = await Promise.all(operations)
                
                // Verificar errores
                for (let i = 0; i < results.length; i++) {
                  const result = results[i]
                  if (result.error) {
                    throw new Error(`Error en operación de niveles: ${result.error.message || result.error}`)
                  }
                }
              }
              
              // Obtener los niveles actualizados
              const { data: updatedLevels, error: fetchUpdatedError } = await supabase
                .from('discipline_levels')
                .select('*')
                .eq('discipline_id', data.id)
                .eq('is_active', true)
                .order('order_index', { ascending: true })
              
              if (fetchUpdatedError) {
                throw fetchUpdatedError
              }
              
              levels = updatedLevels || []
            }
          } else {
            // No hay niveles válidos, desactivar todos los existentes
            const { error: deactivateError } = await supabase
              .from('discipline_levels')
              .update({ 
                is_active: false, 
                updated_at: new Date().toISOString() 
              })
              .eq('discipline_id', data.id)
            
            if (deactivateError) {
              throw deactivateError
            }
          }
        } else {
          // Mantener niveles existentes
          const currentDiscipline = disciplines.find(d => d.id === data.id)
          levels = currentDiscipline?.levels || []
        }

        // Paso 3: Actualizar estado local
        setDisciplines(prev => 
          prev.map(d => d.id === data.id ? { ...updatedDiscipline, levels } : d)
        )

        return { data: updatedDiscipline }
      }
      
      // Ejecutar con timeout
      const result = await Promise.race([updatePromise(), timeoutPromise])
      return result
    } catch (err) {
      console.error('Error updating discipline:', err)
      return { error: err instanceof Error ? err.message : 'Error al actualizar disciplina' }
    }
  }

  // Eliminar disciplina (soft delete)
  const deleteDiscipline = async (id: string) => {
    try {
      console.log('🗑️ Attempting to delete discipline:', id)
      
      const { error } = await supabase
        .from('disciplines')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('✅ Discipline soft deleted successfully, updating local state')
      
      // Solo actualizar el estado local si la eliminación fue exitosa
      setDisciplines(prev => prev.filter(d => d.id !== id))
      
      return { success: true }
    } catch (err) {
      console.error('❌ Error deleting discipline:', err)
      return { error: err instanceof Error ? err.message : 'Error al eliminar disciplina' }
    }
  }

  // Crear nuevo nivel de disciplina
  const createDisciplineLevel = async (data: CreateDisciplineLevelData) => {
    try {
      const { data: newLevel, error } = await supabase
        .from('discipline_levels')
        .insert({
          ...data,
          order_index: data.order_index ?? 0
        })
        .select()
        .single()

      if (error) throw error

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
      const { data: updatedLevel, error } = await supabase
        .from('discipline_levels')
        .update({
          name: data.name,
          description: data.description,
          order_index: data.order_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .select()
        .single()

      if (error) throw error

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
      const { error } = await supabase
        .from('discipline_levels')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

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
      const updates = disciplineIds.map((id, index) => 
        supabase
          .from('disciplines')
          .update({ order_index: index, updated_at: new Date().toISOString() })
          .eq('id', id)
      )

      const results = await Promise.all(updates)
      const hasError = results.some(result => result.error)

      if (hasError) {
        throw new Error('Error al reordenar disciplinas')
      }

      // Actualizar estado local
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
      const updates = levelIds.map((id, index) => 
        supabase
          .from('discipline_levels')
          .update({ order_index: index, updated_at: new Date().toISOString() })
          .eq('id', id)
      )

      const results = await Promise.all(updates)
      const hasError = results.some(result => result.error)

      if (hasError) {
        throw new Error('Error al reordenar niveles')
      }

      // Actualizar estado local
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
  }, [adminId])

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