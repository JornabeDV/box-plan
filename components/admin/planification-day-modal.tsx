'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [planificationToDelete, setPlanificationToDelete] = useState<Planification | null>(null)

  const handleDeleteClick = (planification: Planification) => {
    setPlanificationToDelete(planification)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (planificationToDelete) {
      setDeletingId(planificationToDelete.id)
      await onDelete(planificationToDelete.id)
      setDeletingId(null)
      setPlanificationToDelete(null)
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


  if (!selectedDate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg m-0 sm:m-4">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Planificaciones del {formatDate(selectedDate)}
          </DialogTitle>
          <DialogDescription>
            Gestiona las planificaciones de entrenamiento para este día
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(planification)}
                          disabled={deletingId === planification.id}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
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
                              <ul className="space-y-1 ml-6 mb-3">
                                {block.items.map((item: string, itemIndex: number) => (
                                  <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {block.notes && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Notas:</p>
                                <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                                  {block.notes}
                                </p>
                              </div>
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

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Planificación"
        description={`¿Estás seguro de que quieres eliminar esta planificación? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        loading={deletingId === planificationToDelete?.id}
      />
    </Dialog>
  )
}