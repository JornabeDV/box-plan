'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Plus, 
  Target, 
  Dumbbell,
  FileText,
  CheckCircle
} from 'lucide-react'
import { Planification } from '@/hooks/use-planifications'

interface PlanificationDayModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  planifications: Planification[]
  onEdit: (planification: Planification) => void
  onDelete: (planificationId: string) => void
  onCreate: (date: Date) => void
}

export function PlanificationDayModal({
  open,
  onOpenChange,
  selectedDate,
  planifications,
  onEdit,
  onDelete,
  onCreate
}: PlanificationDayModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (planificationId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta planificación?')) {
      setDeletingId(planificationId)
      await onDelete(planificationId)
      setDeletingId(null)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTotalDuration = () => {
    return planifications.reduce((total, plan) => total + (plan.estimated_duration || 0), 0)
  }

  const getTotalBlocks = () => {
    return planifications.reduce((total, plan) => total + (plan.blocks?.length || 0), 0)
  }

  if (!selectedDate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Planificaciones del {formatDate(selectedDate)}
          </DialogTitle>
          <DialogDescription>
            Gestiona las planificaciones de entrenamiento para este día
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen del día */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Planificaciones</p>
                    <p className="text-2xl font-bold text-primary">{planifications.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Duración Total</p>
                    <p className="text-2xl font-bold text-primary">{getTotalDuration()} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Bloques Totales</p>
                    <p className="text-2xl font-bold text-primary">{getTotalBlocks()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de planificaciones */}
          {planifications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay planificaciones</h3>
                <p className="text-muted-foreground mb-4">
                  Este día no tiene planificaciones de entrenamiento
                </p>
                <Button onClick={() => onCreate(selectedDate)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Planificación
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Botón para crear nueva planificación */}
              <div className="flex justify-end">
                <Button onClick={() => onCreate(selectedDate)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Planificación
                </Button>
              </div>

              {/* Lista de planificaciones */}
              {planifications.map((planification) => (
                <Card key={planification.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {planification.discipline && (
                            <Badge 
                              style={{ backgroundColor: planification.discipline.color }} 
                              className="text-white"
                            >
                              {planification.discipline.name}
                            </Badge>
                          )}
                          {planification.discipline_level && (
                            <Badge variant="outline">
                              {planification.discipline_level.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {planification.estimated_duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{planification.estimated_duration} min</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Dumbbell className="w-4 h-4" />
                            <span>{planification.blocks?.length || 0} bloques</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(planification)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(planification.id)}
                          disabled={deletingId === planification.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Bloques de la planificación */}
                    {planification.blocks && planification.blocks.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Bloques de Entrenamiento
                        </h4>
                        {planification.blocks.map((block: any, blockIndex: number) => (
                          <div key={blockIndex} className="bg-muted/50 rounded-lg p-3">
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-primary" />
                              {block.title || `Bloque ${blockIndex + 1}`}
                            </h5>
                            {block.items && block.items.length > 0 && (
                              <ul className="space-y-1 ml-6">
                                {block.items.map((item: string, itemIndex: number) => (
                                  <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notas */}
                    {planification.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium text-sm mb-2">Notas</h4>
                        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                          {planification.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
