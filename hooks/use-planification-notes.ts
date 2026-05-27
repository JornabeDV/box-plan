'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from './use-toast'

export interface AthleteNote {
  id: string
  note: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  isOwn: boolean
}

interface UsePlanificationNotesProps {
  planificationId: string | number | null
}

export function usePlanificationNotes({ planificationId }: UsePlanificationNotesProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState<AthleteNote[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchNotes = useCallback(async () => {
    if (!planificationId) {
      setNotes([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/planifications/${planificationId}/notes`)
      if (!response.ok) {
        throw new Error('Error al cargar notas')
      }
      const data = await response.json()
      setNotes(data.data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }, [planificationId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const addNote = useCallback(async (noteText: string) => {
    if (!planificationId || !noteText.trim()) return false

    setSubmitting(true)
    try {
      const response = await fetch(`/api/planifications/${planificationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al guardar la nota')
      }

      const data = await response.json()
      setNotes((prev) => [data.data, ...prev])

      toast({
        title: 'Nota guardada',
        description: 'Tu nota se publicó correctamente.',
      })

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar la nota'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
      return false
    } finally {
      setSubmitting(false)
    }
  }, [planificationId, toast])

  const deleteNote = useCallback(async (noteId: string) => {
    if (!planificationId) return false

    try {
      const response = await fetch(
        `/api/planifications/${planificationId}/notes/${noteId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al eliminar la nota')
      }

      setNotes((prev) => prev.filter((n) => n.id !== noteId))

      toast({
        title: 'Nota eliminada',
        description: 'La nota se eliminó correctamente.',
      })

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la nota'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
      return false
    }
  }, [planificationId, toast])

  const updateNote = useCallback(async (noteId: string, noteText: string) => {
    if (!planificationId || !noteText.trim()) return false

    setSubmitting(true)
    try {
      const response = await fetch(
        `/api/planifications/${planificationId}/notes/${noteId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: noteText.trim() }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al actualizar la nota')
      }

      const data = await response.json()
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? data.data : n))
      )

      toast({
        title: 'Nota actualizada',
        description: 'Tu nota se actualizó correctamente.',
      })

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar la nota'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
      return false
    } finally {
      setSubmitting(false)
    }
  }, [planificationId, toast])

  return {
    notes,
    loading,
    submitting,
    addNote,
    deleteNote,
    updateNote,
    refreshNotes: fetchNotes,
  }
}
