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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  Dumbbell, 
  Target, 
  Zap,
  Calendar,
  FileText,
  Settings
} from 'lucide-react'

interface Exercise {
  name: string
  weight?: string
  reps?: string
  sets?: string
  notes?: string
}

interface CreateWODModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<{ error?: string }>
}

export function CreateWODModal({ 
  open, 
  onOpenChange, 
  onSubmit 
}: CreateWODModalProps) {
  const [formData, setFormData] = useState({
    // Información básica
    name: '',
    description: '',
    type: 'metcon' as 'metcon' | 'strength' | 'skill' | 'endurance',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration_minutes: '',
    
    // Ejercicios
    exercises: [] as Exercise[],
    
    // Información adicional
    instructions: '',
    scaling: '',
    tips: [] as string[],
    
    // Configuración
    is_public: false,
    is_template: false,
    date: ''
  })

  const [newTip, setNewTip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('basic')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await onSubmit({
        ...formData,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined
      })

      if (result.error) {
        setError(result.error)
      } else {
        // Reset form
        setFormData({
          name: '',
          description: '',
          type: 'metcon',
          difficulty: 'beginner',
          duration_minutes: '',
          exercises: [],
          instructions: '',
          scaling: '',
          tips: [],
          is_public: false,
          is_template: false,
          date: ''
        })
        onOpenChange(false)
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      setError('Error al crear el WOD')
    } finally {
      setLoading(false)
    }
  }

  const addExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', weight: '', reps: '', sets: '', notes: '' }]
    }))
  }

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }))
  }

  const removeExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }))
  }

  const addTip = () => {
    if (newTip.trim() && !formData.tips.includes(newTip.trim())) {
      setFormData(prev => ({
        ...prev,
        tips: [...prev.tips, newTip.trim()]
      }))
      setNewTip('')
    }
  }

  const removeTip = (tip: string) => {
    setFormData(prev => ({
      ...prev,
      tips: prev.tips.filter(t => t !== tip)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Crear Nuevo WOD
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo Workout of the Day con todos los detalles necesarios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
            </TabsList>

            {/* Información Básica */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del WOD *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Fran, Cindy, Murph"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de WOD *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'metcon' | 'strength' | 'skill' | 'endurance') => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metcon">MetCon</SelectItem>
                      <SelectItem value="strength">Fuerza</SelectItem>
                      <SelectItem value="skill">Habilidad</SelectItem>
                      <SelectItem value="endurance">Resistencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej: 21-15-9 reps de thrusters y pull-ups"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                    placeholder="8"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha del WOD</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Ejercicios */}
            <TabsContent value="exercises" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ejercicios del WOD</h3>
                <Button type="button" onClick={addExercise} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Ejercicio
                </Button>
              </div>

              {formData.exercises.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Dumbbell className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No hay ejercicios agregados. Haz clic en "Agregar Ejercicio" para comenzar.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {formData.exercises.map((exercise, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Ejercicio {index + 1}</CardTitle>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeExercise(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nombre del Ejercicio *</Label>
                            <Input
                              value={exercise.name}
                              onChange={(e) => updateExercise(index, 'name', e.target.value)}
                              placeholder="Ej: Thrusters, Pull-ups"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Peso</Label>
                            <Input
                              value={exercise.weight}
                              onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                              placeholder="Ej: 43kg/30kg"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Repeticiones</Label>
                            <Input
                              value={exercise.reps}
                              onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                              placeholder="Ej: 21-15-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Series</Label>
                            <Input
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                              placeholder="Ej: 3"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Notas</Label>
                          <Textarea
                            value={exercise.notes}
                            onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                            placeholder="Notas adicionales sobre el ejercicio"
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Detalles Adicionales */}
            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions">Instrucciones Detalladas</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Describe paso a paso cómo realizar el WOD..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scaling">Opciones de Escalado</Label>
                <Textarea
                  id="scaling"
                  value={formData.scaling}
                  onChange={(e) => setFormData(prev => ({ ...prev, scaling: e.target.value }))}
                  placeholder="Describe las opciones de escalado para diferentes niveles..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Consejos y Tips</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    placeholder="Agregar consejo"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTip())}
                  />
                  <Button type="button" onClick={addTip} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tips.length > 0 && (
                  <div className="space-y-2">
                    {formData.tips.map((tip, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <span className="text-sm">{tip}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTip(tip)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Configuración */}
            <TabsContent value="config" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_public: !!checked }))
                    }
                  />
                  <Label htmlFor="is_public">Hacer público para todos los usuarios</Label>
                </div>

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
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumen del WOD</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Nombre:</strong> {formData.name || 'Sin nombre'}</div>
                  <div><strong>Tipo:</strong> {formData.type}</div>
                  <div><strong>Dificultad:</strong> {formData.difficulty}</div>
                  <div><strong>Duración:</strong> {formData.duration_minutes || 'Variable'} min</div>
                  <div><strong>Ejercicios:</strong> {formData.exercises.length}</div>
                  <div><strong>Público:</strong> {formData.is_public ? 'Sí' : 'No'}</div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.description}>
              {loading ? 'Creando...' : 'Crear WOD'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}