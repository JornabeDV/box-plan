'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ScoreMetric, WorkoutBlockResult } from '@/components/planification/types'

interface UseBlockResultsProps {
  planificationId: string | undefined
}

export interface BlockResultValue {
  seconds?: number
  weight?: number
  reps?: number
  rounds?: number
  unit?: 'kg' | 'lb'
}

export function useBlockResults({ planificationId }: UseBlockResultsProps) {
  const [results, setResults] = useState<Record<string, WorkoutBlockResult>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const fetchResults = useCallback(async () => {
    if (!planificationId) {
      setResults({})
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/workouts/block-results?planificationId=${planificationId}`)
      if (!response.ok) throw new Error('Error al cargar resultados')

      const data = await response.json()
      const mapped: Record<string, WorkoutBlockResult> = {}
      for (const result of data.results || []) {
        mapped[String(result.planificationBlockId || result.planification_block_id)] = {
          id: String(result.id),
          workout_id: String(result.workoutId || result.workout_id),
          planification_block_id: String(result.planificationBlockId || result.planification_block_id),
          metric: result.metric,
          value: result.value,
          completed_at: result.completedAt || result.completed_at,
        }
      }
      setResults(mapped)
    } catch (error) {
      console.error('Error fetching block results:', error)
    } finally {
      setLoading(false)
    }
  }, [planificationId])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const saveResult = useCallback(async (
    planificationBlockId: string,
    metric: ScoreMetric,
    value: BlockResultValue
  ): Promise<WorkoutBlockResult | null> => {
    if (!planificationId) return null

    setSaving(prev => ({ ...prev, [planificationBlockId]: true }))
    try {
      const response = await fetch('/api/workouts/block-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planification_block_id: planificationBlockId,
          metric,
          value,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar resultado')
      }

      const result = await response.json()
      const mapped: WorkoutBlockResult = {
        id: String(result.id),
        workout_id: String(result.workoutId),
        planification_block_id: String(result.planificationBlockId),
        metric: result.metric,
        value: result.value,
        completed_at: result.completedAt,
      }

      setResults(prev => ({ ...prev, [planificationBlockId]: mapped }))
      return mapped
    } catch (error) {
      console.error('Error saving block result:', error)
      return null
    } finally {
      setSaving(prev => ({ ...prev, [planificationBlockId]: false }))
    }
  }, [planificationId])

  return {
    results,
    loading,
    saving,
    saveResult,
    refresh: fetchResults,
  }
}
