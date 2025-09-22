'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Edit, 
  GripVertical,
  Target,
  Palette
} from 'lucide-react'

interface Discipline {
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

interface DisciplineLevel {
  id: string
  discipline_id: string
  name: string
  description?: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DisciplineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  discipline?: Discipline | null
  onSubmit: (data: any) => Promise<{ error?: string }>
}

const PREDEFINED_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
]


export function DisciplineModal({ 
  open, 
  onOpenChange, 
  discipline,
  onSubmit 
}: DisciplineModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    order_index: 0
  })
  const [levels, setLevels] = useState<Omit<DisciplineLevel, 'id' | 'discipline_id' | 'created_at' | 'updated_at'>[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Inicializar formulario cuando cambie la disciplina
  useEffect(() => {
    if (discipline) {
      setFormData({
        name: discipline.name,
        description: discipline.description || '',
        color: discipline.color,
        order_index: discipline.order_index
      })
      setLevels(discipline.levels?.map(level => ({
        name: level.name,
        description: level.description || '',
        order_index: level.order_index,
        is_active: level.is_active
      })) || [])
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        order_index: 0
      })
      setLevels([])
    }
    setError(null)
    setRetryCount(0)
  }, [discipline])

  const handleSubmit = async (e: React.FormEvent, isRetry = false) => {
    e.preventDefault()
    
    setLoading(true)
    setLoadingStep(isRetry ? 'Reintentando operación...' : 'Preparando datos...')
    setError(null)

    try {
      const submitData = {
        ...formData,
        levels: levels.filter(level => level.name.trim() !== '')
      }
      
      setLoadingStep(discipline ? 'Actualizando disciplina...' : 'Creando disciplina...')
      
      const result = await onSubmit(submitData) as { error?: string }

      if (result.error) {
        setError(result.error)
        // No cerrar el modal si hay error para que el usuario pueda ver el mensaje
      } else {
        onOpenChange(false)
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar disciplina'
      setError(errorMessage)
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1)
      handleSubmit(new Event('submit') as any, true)
    }
  }

  const addLevel = () => {
    setLevels(prev => {
      const newLevel = {
        name: '',
        description: '',
        order_index: prev.length,
        is_active: true
      }
      return [...prev, newLevel]
    })
  }

  const updateLevel = (index: number, field: string, value: string) => {
    setLevels(prev => prev.map((level, i) => 
      i === index ? { ...level, [field]: value } : level
    ))
  }

  const removeLevel = (index: number) => {
    setLevels(prev => {
      const newLevels = prev.filter((_, i) => i !== index)
      // Actualizar order_index después de eliminar
      newLevels.forEach((level, i) => {
        level.order_index = i
      })
      return newLevels
    })
  }

  const moveLevel = (index: number, direction: 'up' | 'down') => {
    setLevels(prev => {
      const newLevels = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      
      // Validar que el índice objetivo esté dentro del rango
      if (targetIndex < 0 || targetIndex >= newLevels.length) {
        return prev // No hacer nada si está fuera de rango
      }
      
      // Intercambiar elementos
      const temp = newLevels[index]
      newLevels[index] = newLevels[targetIndex]
      newLevels[targetIndex] = temp
      
      // Actualizar order_index para todos los niveles
      newLevels.forEach((level, i) => {
        level.order_index = i
      })
      
      return newLevels
    })
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg m-0 sm:m-4">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {discipline ? 'Editar Disciplina' : 'Crear Nueva Disciplina'}
          </DialogTitle>
          <DialogDescription>
            {discipline 
              ? 'Modifica los detalles de la disciplina y sus niveles.'
              : 'Crea una nueva disciplina con sus niveles de categorización.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica de la disciplina */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Disciplina</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: CrossFit, Yoga, Pilates..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe brevemente esta disciplina..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {PREDEFINED_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-foreground' : 'border-muted'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-8 h-8 rounded border"
                    />
                    <span className="text-sm text-muted-foreground">Personalizado</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Niveles de la disciplina */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Niveles de la Disciplina</CardTitle>
                <Button type="button" onClick={addLevel} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Nivel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {levels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay niveles definidos</p>
                  <p className="text-sm">Agrega niveles para categorizar esta disciplina</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {levels.map((level, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveLevel(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-muted rounded disabled:opacity-50"
                          title="Mover hacia arriba"
                        >
                          <GripVertical className="w-4 h-4 rotate-180" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLevel(index, 'down')}
                          disabled={index === levels.length - 1}
                          className="p-1 hover:bg-muted rounded disabled:opacity-50"
                          title="Mover hacia abajo"
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Input
                            value={level.name}
                            onChange={(e) => updateLevel(index, 'name', e.target.value)}
                            placeholder="Nombre del nivel"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            value={level.description}
                            onChange={(e) => updateLevel(index, 'description', e.target.value)}
                            placeholder="Descripción (opcional)"
                          />
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLevel(index)}
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-destructive font-medium">Error al guardar disciplina</p>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                  {retryCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Intento {retryCount} de 3
                    </p>
                  )}
                </div>
                {retryCount < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={loading}
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Reintentar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {loading ? 'Cancelando...' : 'Cancelar'}
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {loadingStep || 'Guardando...'}
                </div>
              ) : (
                discipline ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}