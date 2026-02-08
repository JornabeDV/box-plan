'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Target } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { DisciplineLevel } from '@/hooks/use-planification-data'

interface LevelPreferenceModalProps {
  open: boolean
  disciplineId: number
  disciplineName: string
  onClose: () => void
  onLevelSelected: (levelId: number) => void
}

export function LevelPreferenceModal({
  open,
  disciplineId,
  disciplineName,
  onClose,
  onLevelSelected,
}: LevelPreferenceModalProps) {
  const [levels, setLevels] = useState<DisciplineLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && disciplineId) {
      fetchLevels()
    }
  }, [open, disciplineId])

  const fetchLevels = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/disciplines/${disciplineId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar niveles')
      }

      const data = await response.json()
      
      if (data.levels && Array.isArray(data.levels)) {
        // Ordenar por order_index si existe
        const sortedLevels = data.levels.sort((a: any, b: any) => 
          (a.order_index || 0) - (b.order_index || 0)
        )
        setLevels(sortedLevels)
      }
    } catch (error) {
      console.error('Error fetching levels:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los niveles',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedLevelId) {
      toast({
        title: 'Selecciona un nivel',
        description: 'Debes elegir un nivel para continuar',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      // Guardar preferencia y notificar al padre
      await onLevelSelected(selectedLevelId)
    } catch (error) {
      console.error('Error saving level preference:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar la preferencia',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // No permitir cerrar el modal sin seleccionar
  const handleOpenChange = (open: boolean) => {
    if (!open && levels.length > 0 && !selectedLevelId) {
      // No cerrar si no hay selección
      return
    }
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Selecciona tu nivel
          </DialogTitle>
          <DialogDescription>
            Elige el nivel de {disciplineName} que vas a practicar hoy.
            Podrás cambiarlo cuando quieras desde el calendario.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : levels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay niveles disponibles para esta disciplina.
            </div>
          ) : (
            <div className="space-y-3">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevelId(level.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedLevelId === level.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <div className="font-semibold text-base">{level.name}</div>
                  {level.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {level.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!selectedLevelId || saving || loading}
            className="w-full sm:w-auto"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar preferencia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
