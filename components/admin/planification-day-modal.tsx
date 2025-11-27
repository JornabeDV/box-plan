"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  Plus,
  Target,
  Dumbbell,
  FileText,
  CheckCircle,
  Copy,
} from "lucide-react";
import { Planification } from "@/hooks/use-planifications";

interface PlanificationDayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  planifications: Planification[];
  onEdit: (planification: Planification) => void;
  onDelete: (planificationId: string) => void;
  onCreate: (date: Date) => void;
  onDuplicate?: (planification: Planification) => void;
  onDuplicateAll?: () => void;
}

export function PlanificationDayModal({
  open,
  onOpenChange,
  selectedDate,
  planifications,
  onEdit,
  onDelete,
  onCreate,
  onDuplicate,
  onDuplicateAll,
}: PlanificationDayModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [planificationToDelete, setPlanificationToDelete] =
    useState<Planification | null>(null);

  const handleDeleteClick = (planification: Planification) => {
    setPlanificationToDelete(planification);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (planificationToDelete) {
      setDeletingId(planificationToDelete.id);
      await onDelete(planificationToDelete.id);
      setDeletingId(null);
      setPlanificationToDelete(null);
    }
  };

  const formatDate = (date: Date) => {
    const weekday = date.toLocaleDateString("es-ES", {
      weekday: "long",
    });
    const day = date.toLocaleDateString("es-ES", {
      day: "numeric",
    });
    const month = date.toLocaleDateString("es-ES", {
      month: "long",
    });
    const year = date.toLocaleDateString("es-ES", {
      year: "numeric",
    });
    return { weekday, day, month, year };
  };

  // Verificar si el día seleccionado es pasado
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  if (!selectedDate) return null;

  const isPast = isPastDate(selectedDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg m-0 sm:m-4 p-4 sm:p-6">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-lg sm:text-xl">Planificaciones</span>
            </div>
            <div className="text-sm sm:text-base font-normal text-muted-foreground ml-6 sm:ml-7 break-words">
              {(() => {
                const dateParts = formatDate(selectedDate);
                return `${dateParts.weekday}, ${dateParts.day} de ${dateParts.month} de ${dateParts.year}`;
              })()}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Gestiona las planificaciones de entrenamiento para este día
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Lista de planificaciones */}
          {planifications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No hay planificaciones
                </h3>
                <p className="text-muted-foreground mb-4">
                  Este día no tiene planificaciones de entrenamiento
                </p>
                {!isPast && (
                  <Button onClick={() => onCreate(selectedDate)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Planificación
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                {onDuplicateAll && (
                  <Button
                    variant="outline"
                    onClick={onDuplicateAll}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Replicar Todas</span>
                    <span className="sm:hidden">Replicar Todas</span>
                  </Button>
                )}
                {!isPast && (
                  <Button
                    onClick={() => onCreate(selectedDate)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Planificación
                  </Button>
                )}
              </div>

              {/* Lista de planificaciones */}
              {planifications.map((planification) => (
                <Card
                  key={planification.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3 sm:pb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {planification.discipline && (
                            <Badge
                              style={{
                                backgroundColor: planification.discipline.color,
                              }}
                              className="text-white text-xs"
                            >
                              {planification.discipline.name}
                            </Badge>
                          )}
                          {planification.discipline_level && (
                            <Badge variant="outline" className="text-xs">
                              {planification.discipline_level.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          {planification.estimated_duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>
                                {planification.estimated_duration} min
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>
                              {planification.blocks?.length || 0} bloques
                            </span>
                          </div>
                        </div>
                      </div>
                      <TooltipProvider delayDuration={0}>
                        <div className="flex gap-2 flex-shrink-0">
                          {onDuplicate && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onDuplicate(planification)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="z-[100]">
                                <p>Duplicar planificación</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {!isPast && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onEdit(planification)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="z-[100]">
                                <p>Editar planificación</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(planification)}
                                disabled={deletingId === planification.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="z-[100]">
                              <p>Eliminar planificación</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Bloques de la planificación */}
                    {planification.blocks &&
                      planification.blocks.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Bloques de Entrenamiento
                          </h4>
                          {planification.blocks.map(
                            (block: any, blockIndex: number) => (
                              <div
                                key={blockIndex}
                                className="bg-muted/50 rounded-lg p-3"
                              >
                                <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                  {block.title || `Bloque ${blockIndex + 1}`}
                                </h5>
                                {block.items && block.items.length > 0 && (
                                  <ul className="space-y-1 ml-6 mb-3">
                                    {block.items.map(
                                      (item: string, itemIndex: number) => (
                                        <li
                                          key={itemIndex}
                                          className="text-sm text-muted-foreground flex items-start gap-2"
                                        >
                                          <span className="text-primary mt-1">
                                            •
                                          </span>
                                          <span>{item}</span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                )}
                                {block.notes && (
                                  <div className="mt-3 pt-3 border-t border-border/50">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      Notas:
                                    </p>
                                    <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                                      {block.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          )}
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
  );
}
