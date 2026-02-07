"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plus,
  X,
  Clock,
  FileText,
  Target,
  Trash2,
  Pencil,
  Check,
  Users,
} from "lucide-react";
import { useDisciplines } from "@/hooks/use-disciplines";

interface Block {
  id: string;
  title: string;
  items: string[];
  order: number;
  notes?: string;
}

interface Planification {
  id?: string;
  coach_id?: string;
  discipline_id?: string | number;
  discipline_level_id?: string | number;
  disciplineId?: number | null; // Formato camelCase (del dashboard)
  disciplineLevelId?: number | null; // Formato camelCase (del dashboard)
  date: string;
  estimated_duration?: number;
  blocks?: Block[];
  notes?: string;
  is_active?: boolean;
  is_personalized?: boolean;
  target_user_id?: string | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface PlanificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planification?: Planification | null;
  selectedDate?: Date | null;
  coachId?: string | null;
  students?: Student[];
  onSubmit: (
    data: Omit<Planification, "id" | "coach_id">,
  ) => Promise<{ error?: string }>;
}

export function PlanificationModal({
  open,
  onOpenChange,
  planification,
  selectedDate,
  coachId,
  students = [],
  onSubmit,
}: PlanificationModalProps) {
  const {
    disciplines,
    disciplineLevels,
    loading: disciplinesLoading,
    fetchDisciplines,
  } = useDisciplines(coachId || null);

  const [formData, setFormData] = useState({
    discipline_id: "",
    discipline_level_id: "",
    estimated_duration: "",
    notes: "",
  });

  const [isPersonalized, setIsPersonalized] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockTitle, setBlockTitle] = useState("");
  const [blockItem, setBlockItem] = useState("");
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{
    blockId: string;
    itemIndex: number;
  } | null>(null);
  const [editingItemValue, setEditingItemValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar niveles de disciplina según la disciplina seleccionada
  const availableLevels = disciplineLevels.filter(
    (level) => level.discipline_id === formData.discipline_id,
  );

  // Verificar si hay disciplinas disponibles
  const hasDisciplines = disciplines.length > 0;

  // Recargar disciplinas cuando se abre el modal (siempre con forceRefresh para tener datos actualizados)
  useEffect(() => {
    if (open && coachId) {
      fetchDisciplines(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coachId]);

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (open) {
      if (planification) {
        // Verificar que el objeto tiene la estructura correcta
        if (!planification.id) {
          setError("Error: La planificación no tiene un ID válido");
          return;
        }

        // Manejar diferentes formatos de datos (camelCase o snake_case)
        // También convertir números a strings para los Select components
        const planificationAny = planification as any;
        const disciplineId = planification.discipline_id
          ? String(planification.discipline_id)
          : planificationAny.disciplineId
            ? String(planificationAny.disciplineId)
            : "";

        const disciplineLevelId = planification.discipline_level_id
          ? String(planification.discipline_level_id)
          : planificationAny.disciplineLevelId
            ? String(planificationAny.disciplineLevelId)
            : "";

        setFormData({
          discipline_id: disciplineId,
          discipline_level_id: disciplineLevelId,
          estimated_duration:
            planification.estimated_duration?.toString() || "",
          notes: planification.notes || "",
        });
        // Manejar bloques desde blocks o exercises
        const blocksToSet =
          planification.blocks || planificationAny.exercises || [];
        setBlocks(Array.isArray(blocksToSet) ? blocksToSet : []);
        // Cargar datos de personalización si existen
        setIsPersonalized(planification.is_personalized || false);
        setSelectedStudent(planification.target_user_id || "");
      } else {
        setFormData({
          discipline_id: "",
          discipline_level_id: "",
          estimated_duration: "",
          notes: "",
        });
        setBlocks([]);
        setIsPersonalized(false);
        setSelectedStudent("");
      }
      setBlockTitle("");
      setBlockItem("");
      setCurrentBlockId(null);
      setEditingItem(null);
      setEditingItemValue("");
      setError(null);
      setLoading(false);
    } else {
      // Limpiar error cuando se cierra el modal
      setError(null);
      setLoading(false);
    }
  }, [open, planification]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Si cambia la disciplina, resetear el nivel
    if (field === "discipline_id") {
      setFormData((prev) => ({ ...prev, discipline_level_id: "" }));
    }
  };

  const addBlock = () => {
    if (blockTitle.trim()) {
      const newBlock: Block = {
        id: Date.now().toString(),
        title: blockTitle.trim(),
        items: [],
        order: blocks.length,
      };
      setBlocks((prev) => [...prev, newBlock]);
      setBlockTitle("");
    }
  };

  const addItemToBlock = (blockId: string) => {
    if (blockItem.trim()) {
      // Si se está editando un inciso, cancelar la edición antes de agregar uno nuevo
      if (editingItem) {
        cancelEditingItem();
      }
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId
            ? { ...block, items: [...block.items, blockItem.trim()] }
            : block,
        ),
      );
      setBlockItem("");
    }
  };

  const removeItemFromBlock = (blockId: string, itemIndex: number) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              items: block.items.filter((_, index) => index !== itemIndex),
            }
          : block,
      ),
    );
  };

  const startEditingItem = (blockId: string, itemIndex: number) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.items[itemIndex]) {
      setEditingItem({ blockId, itemIndex });
      setEditingItemValue(block.items[itemIndex]);
    }
  };

  const saveEditingItem = () => {
    if (editingItem && editingItemValue.trim()) {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === editingItem.blockId
            ? {
                ...block,
                items: block.items.map((item, index) =>
                  index === editingItem.itemIndex
                    ? editingItemValue.trim()
                    : item,
                ),
              }
            : block,
        ),
      );
      setEditingItem(null);
      setEditingItemValue("");
    }
  };

  const cancelEditingItem = () => {
    setEditingItem(null);
    setEditingItemValue("");
  };

  const removeBlock = (blockId: string) => {
    // Si se está editando un inciso de este bloque, cancelar la edición
    if (editingItem?.blockId === blockId) {
      cancelEditingItem();
    }
    setBlocks((prev) => prev.filter((block) => block.id !== blockId));
  };

  const updateBlockTitle = (blockId: string, newTitle: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, title: newTitle } : block,
      ),
    );
  };

  const updateBlockNotes = (blockId: string, notes: string) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === blockId ? { ...block, notes } : block)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar planificación personalizada
    if (isPersonalized && !selectedStudent) {
      setError(
        "Debes seleccionar un estudiante para planificaciones personalizadas",
      );
      return;
    }

    // Validar campos requeridos (solo para generales)
    if (!isPersonalized) {
      if (!formData.discipline_id) {
        setError("Debe seleccionar una disciplina");
        return;
      }

      if (!formData.discipline_level_id) {
        setError("Debe seleccionar un nivel de disciplina");
        return;
      }
    }

    if (!selectedDate && !planification) {
      setError("Debe seleccionar una fecha");
      return;
    }

    if (blocks.length === 0) {
      setError("Debe agregar al menos un bloque de contenido");
      return;
    }

    setLoading(true);
    setError(null);

    // Timeout de seguridad para evitar que se quede tildado
    const timeoutId = setTimeout(() => {
      console.warn("Planification submit timeout, resetting loading state");
      setError(
        "La operación está tardando demasiado. Por favor, inténtalo de nuevo.",
      );
      setLoading(false);
    }, 8000); // Reducido a 8 segundos

    try {
      // Función helper para obtener la fecha en formato YYYY-MM-DD sin problemas de timezone
      const getLocalDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const submitData = {
        discipline_id: formData.discipline_id || undefined,
        discipline_level_id: formData.discipline_level_id || undefined,
        date: planification?.date || getLocalDateString(selectedDate!),
        estimated_duration: formData.estimated_duration
          ? parseInt(formData.estimated_duration)
          : undefined,
        blocks: blocks,
        notes: formData.notes.trim() || undefined,
        is_active: true,
        is_personalized: isPersonalized,
        target_user_id: isPersonalized ? selectedStudent : null,
      };

      // Verificar que si es una edición, el ID existe
      if (planification && !planification.id) {
        setError("ID de planificación no válido para la edición");
        setLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      const result = await onSubmit(submitData);

      clearTimeout(timeoutId);

      if (result.error) {
        console.error("Planification creation error:", result.error);
        setError(result.error);
        setLoading(false);
      } else {
        setLoading(false);
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      clearTimeout(timeoutId);
      setError(
        "Error al procesar la solicitud. Por favor, inténtalo de nuevo.",
      );
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg p-4 sm:p-6">
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center gap-2">
            {planification ? "Editar Planificación" : "Nueva Planificación"}
          </DialogTitle>
          <DialogDescription className="text-left">
            {planification
              ? "Modifica los detalles de la planificación"
              : `Planificación para ${selectedDate?.toLocaleDateString(
                  "es-ES",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Verificar si hay disciplinas disponibles */}
          {!hasDisciplines && !disciplinesLoading && (
            <div className="text-center py-8">
              <div className="text-destructive mb-2">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">
                  No hay disciplinas disponibles
                </h3>
                <p className="text-sm text-muted-foreground">
                  Debe crear al menos una disciplina antes de crear
                  planificaciones.
                </p>
              </div>
            </div>
          )}

          {/* Información básica */}
          {hasDisciplines && (
            <div className="space-y-6">
              {/* Tipo de planificación */}
              <Label className="text-base font-semibold">
                Tipo de Planificación
              </Label>
              <Select
                value={isPersonalized ? "personalized" : "general"}
                onValueChange={(val) => {
                  setIsPersonalized(val === "personalized");
                  if (val === "general") {
                    setSelectedStudent("");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo de planificación..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <div className="flex items-center gap-2 whitespace-normal">
                      <Target className="w-4 h-4 flex-shrink-0" />
                      <span className="break-words">
                        General (Todos los estudiantes)
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="personalized">
                    <div className="flex items-center gap-2 whitespace-normal">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span className="break-words">
                        Personalizada (Un estudiante)
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Selector de estudiante si es personalizada */}
              {isPersonalized && (
                <div className="space-y-2 mt-3">
                  <Label htmlFor="student">Estudiante *</Label>
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar estudiante..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          <span className="truncate block max-w-[250px]">
                            {student.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discipline">
                    Disciplina {!isPersonalized && "*"}
                  </Label>
                  <Select
                    value={formData.discipline_id}
                    onValueChange={(value) =>
                      handleInputChange("discipline_id", value)
                    }
                    disabled={disciplinesLoading}
                  >
                    <SelectTrigger className="w-full">
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

                <div className="space-y-2 w-full">
                  <Label htmlFor="level">Nivel {!isPersonalized && "*"}</Label>
                  <Select
                    value={formData.discipline_level_id}
                    onValueChange={(value) =>
                      handleInputChange("discipline_level_id", value)
                    }
                    disabled={!formData.discipline_id || disciplinesLoading}
                  >
                    <SelectTrigger className="w-full">
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
                    onChange={(e) =>
                      handleInputChange("estimated_duration", e.target.value)
                    }
                    placeholder="60"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bloques de contenido */}
          {hasDisciplines && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Bloques de contenido</Label>
                <Badge variant="outline">{blocks.length} bloques</Badge>
              </div>

              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <Card
                    key={block.id}
                    className="p-4 border-l-4 border-l-primary"
                  >
                    <div className="space-y-3">
                      {/* Título del bloque */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <Input
                          value={block.title}
                          onChange={(e) =>
                            updateBlockTitle(block.id, e.target.value)
                          }
                          placeholder="Título del bloque (ej: Entrada en calor)"
                          className="font-medium min-w-0 text-sm placeholder:text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBlock(block.id)}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Incisos del bloque */}
                      <div className="ml-6 sm:ml-9 space-y-2">
                        {block.items.map((item, itemIndex) => {
                          const isEditing =
                            editingItem?.blockId === block.id &&
                            editingItem?.itemIndex === itemIndex;

                          return (
                            <div
                              key={itemIndex}
                              className="flex items-center gap-2"
                            >
                              <span className="text-muted-foreground">-</span>
                              {isEditing ? (
                                <>
                                  <Input
                                    className="text-sm flex-1 h-8 font-medium min-w-0 text-sm placeholder:text-sm"
                                    value={editingItemValue}
                                    onChange={(e) =>
                                      setEditingItemValue(e.target.value)
                                    }
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        saveEditingItem();
                                      } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        cancelEditingItem();
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={saveEditingItem}
                                    disabled={!editingItemValue.trim()}
                                    className="text-primary hover:text-primary-foreground hover:bg-primary h-6 w-6 p-0"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelEditingItem}
                                    className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span
                                    className="text-sm flex-1 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1"
                                    onClick={() =>
                                      startEditingItem(block.id, itemIndex)
                                    }
                                    title="Haz clic para editar"
                                  >
                                    {item}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      startEditingItem(block.id, itemIndex)
                                    }
                                    className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                                    title="Editar inciso"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeItemFromBlock(block.id, itemIndex)
                                    }
                                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-6 w-6 p-0"
                                    title="Eliminar inciso"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          );
                        })}

                        {/* Agregar inciso */}
                        <div className="flex gap-2">
                          <Input
                            className="text-sm min-w-0 font-medium text-sm placeholder:text-sm h-auto"
                            value={currentBlockId === block.id ? blockItem : ""}
                            onChange={(e) => {
                              setCurrentBlockId(block.id);
                              setBlockItem(e.target.value);
                            }}
                            placeholder="Agregar inciso..."
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addItemToBlock(block.id);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addItemToBlock(block.id)}
                            disabled={
                              !blockItem.trim() || currentBlockId !== block.id
                            }
                            className="flex-shrink-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Notas del bloque */}
                        <div className="mt-3">
                          <Label
                            htmlFor={`block-notes-${block.id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Notas del bloque (opcional)
                          </Label>
                          <Textarea
                            id={`block-notes-${block.id}`}
                            value={block.notes || ""}
                            onChange={(e) =>
                              updateBlockNotes(block.id, e.target.value)
                            }
                            placeholder="Agregar notas específicas para este bloque..."
                            className="text-sm mt-1 min-h-[60px] border border-color bg-input"
                            rows={2}
                          />
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
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addBlock())
                  }
                  className="min-w-0 h-auto text-sm placeholder:text-sm"
                />
                <Button
                  type="button"
                  onClick={addBlock}
                  disabled={!blockTitle.trim()}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Notas */}
          {hasDisciplines && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Notas importantes, consideraciones especiales, etc..."
                rows={3}
                className="text-sm placeholder:text-sm border border-color bg-input"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !hasDisciplines ||
                !formData.discipline_id ||
                !formData.discipline_level_id
              }
              className="w-full sm:w-auto"
            >
              {loading
                ? "Guardando..."
                : planification
                  ? "Actualizar"
                  : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
