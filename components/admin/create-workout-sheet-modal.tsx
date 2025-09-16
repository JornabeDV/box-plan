'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'

interface WorkoutSheetCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
  created_at: string
}

interface CreateWorkoutSheetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: WorkoutSheetCategory[]
  onSubmit: (data: any) => Promise<{ error?: string }>
}

export function CreateWorkoutSheetModal({ 
  open, 
  onOpenChange, 
  categories, 
  onSubmit 
}: CreateWorkoutSheetModalProps) {
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimated_duration: '',
    equipment_needed: [] as string[],
    tags: [] as string[],
    is_template: false,
    is_public: false
  })

  const [newEquipment, setNewEquipment] = useState('')
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Creating workout sheet with data:', formData)
      
      const result = await onSubmit({
        ...formData,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : undefined,
        content: {
          exercises: [],
          notes: '',
          instructions: ''
        }
      })

      console.log('Create result:', result)

      if (result.error) {
        console.error('Error creating workout sheet:', result.error)
        setError(result.error)
      } else {
        console.log('Workout sheet created successfully')
        // Reset form
        setFormData({
          category_id: '',
          title: '',
          description: '',
          difficulty: 'beginner',
          estimated_duration: '',
          equipment_needed: [],
          tags: [],
          is_template: false,
          is_public: false
        })
        onOpenChange(false)
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      setError('Error al crear la planilla')
    } finally {
      setLoading(false)
    }
  }

  const addEquipment = () => {
    if (newEquipment.trim() && !formData.equipment_needed.includes(newEquipment.trim())) {
      setFormData(prev => ({
        ...prev,
        equipment_needed: [...prev.equipment_needed, newEquipment.trim()]
      }))
      setNewEquipment('')
    }
  }

  const removeEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipment_needed: prev.equipment_needed.filter(e => e !== equipment)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Planilla</DialogTitle>
          <DialogDescription>
            Crea una nueva planilla de entrenamiento para tus usuarios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad *</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                  setFormData(prev => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nombre de la planilla"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción de la planilla"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duración Estimada (minutos)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.estimated_duration}
              onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: e.target.value }))}
              placeholder="30"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label>Equipamiento Necesario</Label>
            <div className="flex gap-2">
              <Input
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                placeholder="Agregar equipamiento"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
              />
              <Button type="button" onClick={addEquipment} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.equipment_needed.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.equipment_needed.map((equipment, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {equipment}
                    <button
                      type="button"
                      onClick={() => removeEquipment(equipment)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Agregar etiqueta"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_template"
                checked={formData.is_template}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_template: !!checked }))
                }
              />
              <Label htmlFor="is_template">Usar como plantilla</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_public: !!checked }))
                }
              />
              <Label htmlFor="is_public">Hacer pública para todos los usuarios</Label>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Planilla'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}