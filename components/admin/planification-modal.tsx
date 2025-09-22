'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, X, Clock, FileText, Target, Trash2 } from 'lucide-react'
import { useDisciplines } from '@/hooks/use-disciplines'

interface Block {
  id: string
  title: string
  items: string[]
  order: number
}

interface Planification {
  id?: string
  admin_id: string
  discipline_id: string
  discipline_level_id: string
  date: string
  estimated_duration?: number
  blocks: Block[]
  notes?: string
  is_active: boolean
}

interface PlanificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planification?: Planification | null
  selectedDate?: Date | null
  adminId?: string | null
  onSubmit: (data: Omit<Planification, 'id' | 'admin_id'>) => Promise<{ error?: string }>
}

export function PlanificationModal({ 
  open, 
  onOpenChange, 
  planification, 
  selectedDate,
  adminId,
  onSubmit 
}: PlanificationModalProps) {
  const { disciplines, disciplineLevels, loading: disciplinesLoading } = useDisciplines(adminId || null)
  
  const [formData, setFormData] = useState({
    discipline_id: '',
    discipline_level_id: '',
    estimated_duration: '',
    notes: ''
  })
  
  const [blocks, setBlocks] = useState<Block[]>([])
  const [blockTitle, setBlockTitle] = useState('')
  const [blockItem, setBlockItem] = useState('')
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtrar niveles de disciplina según la disciplina seleccionada
  const availableLevels = disciplineLevels.filter(level => 
    level.discipline_id === formData.discipline_id
  )

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (open) {
      if (planification) {
        setFormData({
          discipline_id: planification.discipline_id,
          discipline_level_id: planification.discipline_level_id,
          estimated_duration: planification.estimated_duration?.toString() || '',
          notes: planification.notes || ''
        })
        setBlocks(planification.blocks || [])
      } else {
        setFormData({
          discipline_id: '',
          discipline_level_id: '',
          estimated_duration: '',
          notes: ''
        })
        setBlocks([])
      }
      setBlockTitle('')
      setBlockItem('')
      setCurrentBlockId(null)
      setError(null)
      setLoading(false)
    }
  }, [open, planification])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Si cambia la disciplina, resetear el nivel
    if (field === 'discipline_id') {
      setFormData(prev => ({ ...prev, discipline_level_id: '' }))
    }
  }

  const addBlock = () => {
    if (blockTitle.trim()) {
      const newBlock: Block = {
        id: Date.now().toString(),
        title: blockTitle.trim(),
        items: [],
        order: blocks.length
      }
      setBlocks(prev => [...prev, newBlock])
      setBlockTitle('')
    }
  }

  const addItemToBlock = (blockId: string) => {
    if (blockItem.trim()) {
      setBlocks(prev => prev.map(block => 
        block.id === blockId 
          ? { ...block, items: [...block.items, blockItem.trim()] }
          : block
      ))
      setBlockItem('')
    }
  }

  const removeItemFromBlock = (blockId: string, itemIndex: number) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, items: block.items.filter((_, index) => index !== itemIndex) }
        : block
    ))
  }

  const removeBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId))
  }

  const updateBlockTitle = (blockId: string, newTitle: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, title: newTitle }
        : block
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.discipline_id) {
      setError('Debe seleccionar una disciplina')
      return
    }
    
    if (!formData.discipline_level_id) {
      setError('Debe seleccionar un nivel de disciplina')
      return
    }

    if (!selectedDate && !planification) {
      setError('Debe seleccionar una fecha')
      return
    }

    setLoading(true)
    setError(null)

    // Timeout de seguridad para evitar que se quede tildado
    const timeoutId = setTimeout(() => {
      console.warn('Planification submit timeout, resetting loading state')
      setError('La operación está tardando demasiado. Por favor, inténtalo de nuevo.')
      setLoading(false)
    }, 15000) // 15 segundos

    try {
      const submitData = {
        discipline_id: formData.discipline_id,
        discipline_level_id: formData.discipline_level_id,
        date: planification?.date || selectedDate!.toISOString().split('T')[0],
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : undefined,
        blocks: blocks,
        notes: formData.notes.trim() || undefined,
        is_active: true
      }

      const result = await onSubmit(submitData)
      
      clearTimeout(timeoutId)
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        setLoading(false)
        onOpenChange(false)
      }
    } catch (err) {
      console.error('Error en handleSubmit:', err)
      clearTimeout(timeoutId)
      setError('Error al procesar la solicitud. Por favor, inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {planification ? 'Editar Planificación' : 'Nueva Planificación'}
          </DialogTitle>
          <DialogDescription>
            {planification 
              ? 'Modifica los detalles de la planificación' 
              : `Planificación para ${selectedDate?.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discipline">Disciplina *</Label>
                <Select
                  value={formData.discipline_id}
                  onValueChange={(value) => handleInputChange('discipline_id', value)}
                  disabled={disciplinesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplines.map((discipline) => (
                      <SelectItem key={discipline.id} value={discipline.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: discipline.color }}
                          />
                          {discipline.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Nivel *</Label>
                <Select
                  value={formData.discipline_level_id}
                  onValueChange={(value) => handleInputChange('discipline_level_id', value)}
                  disabled={!formData.discipline_id || disciplinesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duración estimada (minutos)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="duration"
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => handleInputChange('estimated_duration', e.target.value)}
                  placeholder="60"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Bloques de contenido */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Bloques de contenido</Label>
              <Badge variant="outline">{blocks.length} bloques</Badge>
            </div>

            <div className="space-y-4">
              {blocks.map((block, index) => (
                <Card key={block.id} className="p-4 border-l-4 border-l-primary">
                  <div className="space-y-3">
                    {/* Título del bloque */}
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <Input
                        value={block.title}
                        onChange={(e) => updateBlockTitle(block.id, e.target.value)}
                        placeholder="Título del bloque (ej: Entrada en calor)"
                        className="font-medium"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlock(block.id)}
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Incisos del bloque */}
                    <div className="ml-9 space-y-2">
                      {block.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-2">
                          <span className="text-muted-foreground">-</span>
                          <span className="text-sm flex-1">{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemFromBlock(block.id, itemIndex)}
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      
                      {/* Agregar inciso */}
                      <div className="flex gap-2">
                        <Input
                          value={currentBlockId === block.id ? blockItem : ''}
                          onChange={(e) => {
                            setCurrentBlockId(block.id)
                            setBlockItem(e.target.value)
                          }}
                          placeholder="Agregar inciso..."
                          className="text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addItemToBlock(block.id)
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addItemToBlock(block.id)}
                          disabled={!blockItem.trim() || currentBlockId !== block.id}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Agregar nuevo bloque */}
            <div className="flex gap-2">
              <Input
                value={blockTitle}
                onChange={(e) => setBlockTitle(e.target.value)}
                placeholder="Título del nuevo bloque..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBlock())}
              />
              <Button
                type="button"
                onClick={addBlock}
                disabled={!blockTitle.trim()}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notas importantes, consideraciones especiales, etc..."
              rows={3}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
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
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.discipline_id || !formData.discipline_level_id}
            >
              {loading ? 'Guardando...' : (planification ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}