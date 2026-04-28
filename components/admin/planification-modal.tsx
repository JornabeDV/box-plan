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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  X,
  Clock,
  Target,
  Trash2,
  Pencil,
  Check,
  Users,
  Upload,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Play,
} from "lucide-react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDisciplines } from "@/hooks/use-disciplines";

interface ItemData {
  id: string;
  description: string;
  exerciseId?: number | null;
  exerciseName?: string;
}

interface SubBlock {
  id: string;
  subtitle: string;
  items: ItemData[];
  timer_mode?: 'normal' | 'tabata' | 'fortime' | 'amrap' | 'emom' | 'otm' | null;
  timer_config?: {
    workTime?: string;
    restTime?: string;
    totalRounds?: string;
    amrapTime?: string;
  };
}

interface Block {
  id: string;
  title: string;
  items: ItemData[];
  order: number;
  notes?: string;
  timer_mode?: 'normal' | 'tabata' | 'fortime' | 'amrap' | 'emom' | 'otm' | null;
  timer_config?: {
    workTime?: string;
    restTime?: string;
    totalRounds?: string;
    amrapTime?: string;
  };
  subBlocks?: SubBlock[];
}

interface Planification {
  id?: string;
  coach_id?: string;
  discipline_id?: string | number;
  discipline_level_id?: string | number;
  disciplineId?: number | null;
  disciplineLevelId?: number | null;
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
  preferredDisciplineId?: string | null;
}

interface PlanificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planification?: Planification | null;
  selectedDate?: Date | null;
  coachId?: string | null;
  students?: Student[];
  canCreatePersonalized?: boolean;
  onSubmit: (
    data: Omit<Planification, "id" | "coach_id">,
  ) => Promise<{ error?: string }>;
  onImport?: () => void;
}

function SortableBlock({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: {
    listeners: ReturnType<typeof useSortable>["listeners"];
    attributes: ReturnType<typeof useSortable>["attributes"];
  }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ listeners, attributes })}
    </div>
  );
}

export function PlanificationModal({
  open,
  onOpenChange,
  planification,
  selectedDate,
  coachId,
  students = [],
  canCreatePersonalized = false,
  onSubmit,
  onImport,
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
  const [isDisciplineLocked, setIsDisciplineLocked] = useState(false);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockTitle, setBlockTitle] = useState("");

  // Estado para items directos del bloque (independiente por bloque, key: blockId)
  const [blockItemInputs, setBlockItemInputs] = useState<
    Record<string, string>
  >({});

  // Estado para items de sub-bloques (independiente por sub-bloque, key: `blockId::subBlockId`)
  const [subBlockItemInputs, setSubBlockItemInputs] = useState<
    Record<string, string>
  >({});

  // Estado para nuevos títulos de sub-bloques (por blockId)
  const [newSubBlockTitles, setNewSubBlockTitles] = useState<
    Record<string, string>
  >({});

  // Estado de edición (aplica a items de bloques y sub-bloques)
  const [editingItem, setEditingItem] = useState<{
    blockId: string;
    subBlockId?: string;
    itemIndex: number;
  } | null>(null);
  const [editingItemValue, setEditingItemValue] = useState("");

  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [activeExerciseSelector, setActiveExerciseSelector] = useState<{
    blockId: string;
    itemIndex: number;
    subBlockId?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableLevels = disciplineLevels.filter(
    (level) => level.discipline_id === formData.discipline_id,
  );

  const hasDisciplines = disciplines.length > 0;

  useEffect(() => {
    if (open && coachId) {
      fetchDisciplines(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coachId]);

  useEffect(() => {
    if (open) {
      if (planification) {
        if (!planification.id) {
          setError("Error: La planificación no tiene un ID válido");
          return;
        }

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
        const blocksToSet =
          planification.blocks || planificationAny.exercises || [];
        
        // Normalizar items del backend al formato interno
        function normalizeItemFromBackend(item: any): ItemData {
          if (typeof item === 'string') {
            return { id: Date.now().toString() + Math.random(), description: item };
          }
          return {
            id: item.id || Date.now().toString() + Math.random(),
            description: item.description || item.text || '',
            exerciseId: item.exerciseId || (item.exercise ? parseInt(item.exercise.id) : null),
            exerciseName: item.exerciseName || (item.exercise ? item.exercise.name : undefined),
          };
        }
        
        function normalizeBlockFromBackend(block: any): Block {
          return {
            ...block,
            id: block.id || Date.now().toString() + Math.random(),
            items: (block.items || []).map(normalizeItemFromBackend),
            subBlocks: (block.subBlocks || []).map((sub: any) => ({
              ...sub,
              id: sub.id || Date.now().toString() + Math.random(),
              items: (sub.items || []).map(normalizeItemFromBackend),
            })),
          };
        }
        
        setBlocks(Array.isArray(blocksToSet) ? blocksToSet.map(normalizeBlockFromBackend) : []);
        setIsPersonalized(planification.is_personalized || false);
        setSelectedStudent(planification.target_user_id || "");

        if (planification.is_personalized && planification.target_user_id) {
          const student = students.find(
            (s) => s.id === planification.target_user_id,
          );
          setIsDisciplineLocked(!!student?.preferredDisciplineId);
        } else {
          setIsDisciplineLocked(false);
        }
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
        setIsDisciplineLocked(false);
      }
      setBlockTitle("");
      setBlockItemInputs({});
      setSubBlockItemInputs({});
      setNewSubBlockTitles({});
      setEditingItem(null);
      setEditingItemValue("");
      setError(null);
      setLoading(false);
    } else {
      setError(null);
      setLoading(false);
    }
  }, [open, planification]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "discipline_id") {
      setFormData((prev) => ({ ...prev, discipline_level_id: "" }));
    }
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);

    if (!studentId) {
      setIsDisciplineLocked(false);
      return;
    }

    const student = students.find((s) => s.id === studentId);

    if (student?.preferredDisciplineId) {
      setFormData((prev) => ({
        ...prev,
        discipline_id: student.preferredDisciplineId!,
        discipline_level_id: "",
      }));
      setIsDisciplineLocked(true);
    } else {
      setIsDisciplineLocked(false);
    }
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex).map((block, i) => ({
          ...block,
          order: i,
        }));
      });
    }
  };

  // ── Bloques ──────────────────────────────────────────────────────────────

  const addBlock = () => {
    if (blockTitle.trim()) {
      const newBlock: Block = {
        id: Date.now().toString(),
        title: blockTitle.trim(),
        items: [],
        order: blocks.length,
        subBlocks: [],
      };
      setBlocks((prev) => [...prev, newBlock]);
      setBlockTitle("");
    }
  };

  const removeBlock = (blockId: string) => {
    if (editingItem?.blockId === blockId) cancelEditingItem();
    setBlockItemInputs((prev) => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });
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

const updateBlockTimer = (blockId: string, timerMode: 'normal' | 'tabata' | 'fortime' | 'amrap' | 'emom' | 'otm' | null) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, timer_mode: timerMode } : block,
      ),
    );
  };

  const updateBlockTimerConfig = (blockId: string, config: { workTime?: string; restTime?: string; totalRounds?: string; amrapTime?: string }) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, timer_config: config } : block,
      ),
    );
  };

  const updateSubBlockTimer = (
    blockId: string,
    subBlockId: string,
    timerMode: 'normal' | 'tabata' | 'fortime' | 'amrap' | 'emom' | 'otm' | null,
  ) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              subBlocks: (block.subBlocks || []).map((sb) =>
                sb.id === subBlockId ? { ...sb, timer_mode: timerMode } : sb,
              ),
            }
          : block,
      ),
    );
  };

  const updateSubBlockTimerConfig = (blockId: string, subBlockId: string, config: { workTime?: string; restTime?: string; totalRounds?: string; amrapTime?: string }) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              subBlocks: (block.subBlocks || []).map((sb) =>
                sb.id === subBlockId ? { ...sb, timer_config: config } : sb,
              ),
            }
          : block,
      ),
    );
  };

  // ── Items directos del bloque ─────────────────────────────────────────────

  const addItemToBlock = (blockId: string) => {
    const itemText = blockItemInputs[blockId]?.trim();
    if (itemText) {
      if (editingItem) cancelEditingItem();
      const newItem: ItemData = { id: Date.now().toString(), description: itemText };
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId
            ? { ...block, items: [...block.items, newItem] }
            : block,
        ),
      );
      setBlockItemInputs((prev) => ({ ...prev, [blockId]: "" }));
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

  // ── Sub-bloques ───────────────────────────────────────────────────────────

  const addSubBlock = (blockId: string) => {
    const title = newSubBlockTitles[blockId]?.trim();
    if (!title) return;
    const newSubBlock: SubBlock = {
      id: Date.now().toString(),
      subtitle: title,
      items: [],
    };
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? { ...block, subBlocks: [...(block.subBlocks || []), newSubBlock] }
          : block,
      ),
    );
    setNewSubBlockTitles((prev) => ({ ...prev, [blockId]: "" }));
  };

  const removeSubBlock = (blockId: string, subBlockId: string) => {
    if (
      editingItem?.blockId === blockId &&
      editingItem?.subBlockId === subBlockId
    ) {
      cancelEditingItem();
    }
    const key = `${blockId}::${subBlockId}`;
    setSubBlockItemInputs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              subBlocks: (block.subBlocks || []).filter(
                (sb) => sb.id !== subBlockId,
              ),
            }
          : block,
      ),
    );
  };

  const updateSubBlockTitle = (
    blockId: string,
    subBlockId: string,
    subtitle: string,
  ) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              subBlocks: (block.subBlocks || []).map((sb) =>
                sb.id === subBlockId ? { ...sb, subtitle } : sb,
              ),
            }
          : block,
      ),
    );
  };

  // ── Items de sub-bloques ──────────────────────────────────────────────────

  const addItemToSubBlock = (blockId: string, subBlockId: string) => {
    const key = `${blockId}::${subBlockId}`;
    const itemText = subBlockItemInputs[key]?.trim();
    if (!itemText) return;
    if (editingItem) cancelEditingItem();
    const newItem: ItemData = { id: Date.now().toString(), description: itemText };
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              subBlocks: (block.subBlocks || []).map((sb) =>
                sb.id === subBlockId
                  ? { ...sb, items: [...sb.items, newItem] }
                  : sb,
              ),
            }
          : block,
      ),
    );
    setSubBlockItemInputs((prev) => ({ ...prev, [key]: "" }));
  };

  const removeItemFromSubBlock = (
    blockId: string,
    subBlockId: string,
    itemIndex: number,
  ) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              subBlocks: (block.subBlocks || []).map((sb) =>
                sb.id === subBlockId
                  ? {
                      ...sb,
                      items: sb.items.filter((_, i) => i !== itemIndex),
                    }
                  : sb,
              ),
            }
          : block,
      ),
    );
  };

  // ── Edición de items (bloque directo o sub-bloque) ────────────────────────

  const startEditingItem = (
    blockId: string,
    itemIndex: number,
    subBlockId?: string,
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    if (subBlockId) {
      const subBlock = block.subBlocks?.find((sb) => sb.id === subBlockId);
      if (subBlock && subBlock.items[itemIndex] !== undefined) {
        setEditingItem({ blockId, subBlockId, itemIndex });
        setEditingItemValue(subBlock.items[itemIndex].description);
      }
    } else {
      if (block.items[itemIndex]) {
        setEditingItem({ blockId, itemIndex });
        setEditingItemValue(block.items[itemIndex].description);
      }
    }
  };

  const saveEditingItem = () => {
    if (!editingItem || !editingItemValue.trim()) return;

    if (editingItem.subBlockId) {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === editingItem.blockId
            ? {
                ...block,
                subBlocks: (block.subBlocks || []).map((sb) =>
                  sb.id === editingItem.subBlockId
                    ? {
                        ...sb,
                        items: sb.items.map((item, index) =>
                          index === editingItem.itemIndex
                            ? { ...item, description: editingItemValue.trim() }
                            : item,
                        ),
                      }
                    : sb,
                ),
              }
            : block,
        ),
      );
    } else {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === editingItem.blockId
            ? {
                ...block,
                items: block.items.map((item, index) =>
                  index === editingItem.itemIndex
                    ? { ...item, description: editingItemValue.trim() }
                    : item,
                ),
              }
            : block,
        ),
      );
    }
    setEditingItem(null);
    setEditingItemValue("");
  };

  const cancelEditingItem = () => {
    setEditingItem(null);
    setEditingItemValue("");
  };

  // ── Ejercicios ────────────────────────────────────────────────────────────

  const loadExercises = async () => {
    if (!coachId) return;
    try {
      const res = await fetch(`/api/exercises?search=${encodeURIComponent(exerciseSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
      }
    } catch (err) {
      console.error('Error loading exercises:', err);
    }
  };

  const assignExerciseToItem = (
    blockId: string,
    itemIndex: number,
    exercise: any,
    subBlockId?: string
  ) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        if (subBlockId) {
          return {
            ...block,
            subBlocks: block.subBlocks?.map((sb) => {
              if (sb.id !== subBlockId) return sb;
              return {
                ...sb,
                items: sb.items.map((item, idx) =>
                  idx === itemIndex
                    ? { ...item, exerciseId: parseInt(exercise.id), exerciseName: exercise.name }
                    : item
                ),
              };
            }),
          };
        }
        return {
          ...block,
          items: block.items.map((item, idx) =>
            idx === itemIndex
              ? { ...item, exerciseId: parseInt(exercise.id), exerciseName: exercise.name }
              : item
          ),
        };
      })
    );
    setActiveExerciseSelector(null);
  };

  const removeExerciseFromItem = (
    blockId: string,
    itemIndex: number,
    subBlockId?: string
  ) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        if (subBlockId) {
          return {
            ...block,
            subBlocks: block.subBlocks?.map((sb) => {
              if (sb.id !== subBlockId) return sb;
              return {
                ...sb,
                items: sb.items.map((item, idx) =>
                  idx === itemIndex
                    ? { ...item, exerciseId: null, exerciseName: undefined }
                    : item
                ),
              };
            }),
          };
        }
        return {
          ...block,
          items: block.items.map((item, idx) =>
            idx === itemIndex
              ? { ...item, exerciseId: null, exerciseName: undefined }
              : item
          ),
        };
      })
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPersonalized && !selectedStudent) {
      setError(
        "Debes seleccionar un estudiante para planificaciones personalizadas",
      );
      return;
    }

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

    const timeoutId = setTimeout(() => {
      console.warn("Planification submit timeout, resetting loading state");
      setError(
        "La operación está tardando demasiado. Por favor, inténtalo de nuevo.",
      );
      setLoading(false);
    }, 8000);

    try {
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
        <DialogHeader className="pb-0">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {planification ? "Editar Planificación" : "Nueva Planificación"}
              </DialogTitle>
              <DialogDescription className="text-left mt-1">
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
            </div>
            {!planification && onImport && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onImport}
                className="flex items-center gap-2 border-dashed border-2 flex-shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Importar Excel</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {hasDisciplines && (
            <div className="space-y-6">
              <Label className="text-base font-semibold">
                Tipo de Planificación
              </Label>
              <Select
                value={isPersonalized ? "personalized" : "general"}
                onValueChange={(val) => {
                  setIsPersonalized(val === "personalized");
                  if (val === "general") setSelectedStudent("");
                }}
                disabled={
                  !canCreatePersonalized && !planification?.is_personalized
                }
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
                  <SelectItem
                    value="personalized"
                    disabled={
                      !canCreatePersonalized && !planification?.is_personalized
                    }
                  >
                    <div className="flex items-center gap-2 whitespace-normal">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span className="break-words">
                        Personalizada (Un estudiante)
                      </span>
                      {!canCreatePersonalized &&
                        !planification?.is_personalized && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (Requiere upgrade)
                          </span>
                        )}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {!canCreatePersonalized && !planification?.is_personalized && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <span className="font-medium">Nota:</span> Tu plan actual no
                  incluye planificaciones personalizadas.{" "}
                  <a
                    href="/pricing/coaches"
                    className="text-primary hover:underline font-medium"
                  >
                    Actualiza tu plan
                  </a>{" "}
                  para acceder a esta función.
                </div>
              )}

              {canCreatePersonalized &&
                isPersonalized &&
                students.length === 0 && (
                  <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
                    <span className="font-medium">Nota:</span> No tienes
                    estudiantes con planes que incluyan planificaciones
                    personalizadas.{" "}
                    <a
                      href="/admin/student-plans"
                      className="text-primary hover:underline font-medium"
                    >
                      Revisar planes de estudiantes
                    </a>
                  </div>
                )}

              {isPersonalized && (
                <div className="space-y-2 mt-3">
                  <Label htmlFor="student">Estudiante *</Label>
                  <Select
                    value={selectedStudent}
                    onValueChange={handleStudentChange}
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
                    disabled={disciplinesLoading || isDisciplineLocked}
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

              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {blocks.map((block, index) => (
                      <SortableBlock key={block.id} id={block.id}>
                        {({ listeners, attributes }) => (
                          <Card className="p-4 border-l-4 border-l-primary">
                            <div className="space-y-3">
                              {/* Título del bloque */}
                              <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                  type="button"
                                  {...listeners}
                                  {...attributes}
                                  className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground flex-shrink-0 p-0.5"
                                  tabIndex={-1}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </button>
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

                              {/* Timer selector para el bloque */}
                              <div className="ml-6 sm:ml-9 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <Select
                                  value={block.timer_mode || "none"}
                                  onValueChange={(value) =>
                                    updateBlockTimer(
                                      block.id,
                                      value === "none" ? null : value as any,
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue placeholder="Sin timer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sin timer</SelectItem>
                                    <SelectItem value="normal">Cronómetro</SelectItem>
                                    <SelectItem value="fortime">FOR TIME</SelectItem>
                                    <SelectItem value="amrap">AMRAP</SelectItem>
                                    <SelectItem value="emom">EMOM</SelectItem>
                                    <SelectItem value="otm">OTM</SelectItem>
                                    <SelectItem value="tabata">TABATA</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Timer config para el bloque */}
                              {block.timer_mode === "tabata" && (
                                <div className="ml-6 sm:ml-9 grid grid-cols-3 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Trabajo</Label>
                                    <Input
                                      type="number"
                                      value={block.timer_config?.workTime || "20"}
                                      onChange={(e) =>
                                        updateBlockTimerConfig(block.id, {
                                          ...block.timer_config,
                                          workTime: e.target.value,
                                        })
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Descanso</Label>
                                    <Input
                                      type="number"
                                      value={block.timer_config?.restTime || "10"}
                                      onChange={(e) =>
                                        updateBlockTimerConfig(block.id, {
                                          ...block.timer_config,
                                          restTime: e.target.value,
                                        })
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Rondas</Label>
                                    <Input
                                      type="number"
                                      value={block.timer_config?.totalRounds || "8"}
                                      onChange={(e) =>
                                        updateBlockTimerConfig(block.id, {
                                          ...block.timer_config,
                                          totalRounds: e.target.value,
                                        })
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>
                              )}

                              {block.timer_mode === "amrap" && (
                                <div className="ml-6 sm:ml-9 grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Tiempo (min)</Label>
                                    <Input
                                      type="number"
                                      value={block.timer_config?.amrapTime || "10"}
                                      onChange={(e) =>
                                        updateBlockTimerConfig(block.id, {
                                          ...block.timer_config,
                                          amrapTime: e.target.value,
                                        })
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Rondas</Label>
                                    <Input
                                      type="number"
                                      value={block.timer_config?.totalRounds || "1"}
                                      onChange={(e) =>
                                        updateBlockTimerConfig(block.id, {
                                          ...block.timer_config,
                                          totalRounds: e.target.value,
                                        })
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>
                              )}

                              {(block.timer_mode === "emom" || block.timer_mode === "otm") && (
                                <div className="ml-6 sm:ml-9 grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Rondas</Label>
                                    <Input
                                      type="number"
                                      value={block.timer_config?.totalRounds || "10"}
                                      onChange={(e) =>
                                        updateBlockTimerConfig(block.id, {
                                          ...block.timer_config,
                                          totalRounds: e.target.value,
                                        })
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  {block.timer_mode === "otm" && (
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">Min/ronda</Label>
                                      <Input
                                        type="number"
                                        value={block.timer_config?.workTime || "2"}
                                        onChange={(e) =>
                                          updateBlockTimerConfig(block.id, {
                                            ...block.timer_config,
                                            workTime: e.target.value,
                                          })
                                        }
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="ml-6 sm:ml-9 space-y-2">
                                {/* Items directos del bloque */}
                                {block.items.map((item, itemIndex) => {
                                  const isEditing =
                                    editingItem?.blockId === block.id &&
                                    !editingItem?.subBlockId &&
                                    editingItem?.itemIndex === itemIndex;
                                  return (
                                    <div
                                      key={itemIndex}
                                      className="flex items-center gap-2 relative"
                                    >
                                      <span className="text-muted-foreground">
                                        -
                                      </span>
                                      {isEditing ? (
                                        <>
                                          <Input
                                            className="text-sm flex-1 h-8 font-medium min-w-0 placeholder:text-sm"
                                            value={editingItemValue}
                                            onChange={(e) =>
                                              setEditingItemValue(
                                                e.target.value,
                                              )
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
                                          <div className="flex-1">
                                            <span
                                              className="text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 inline-block"
                                              onClick={() =>
                                                startEditingItem(
                                                  block.id,
                                                  itemIndex,
                                                )
                                              }
                                              title="Haz clic para editar"
                                            >
                                              {item.description}
                                            </span>
                                            {item.exerciseName && (
                                              <span className="inline-flex items-center gap-1 ml-2 text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                                <Play className="w-3 h-3" />
                                                {item.exerciseName}
                                                <button
                                                  type="button"
                                                  onClick={() => removeExerciseFromItem(block.id, itemIndex)}
                                                  className="hover:text-blue-900 ml-1"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </span>
                                            )}
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              setActiveExerciseSelector({
                                                blockId: block.id,
                                                itemIndex,
                                              })
                                            }
                                            className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                                            title="Asignar ejercicio"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              startEditingItem(
                                                block.id,
                                                itemIndex,
                                              )
                                            }
                                            className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              removeItemFromBlock(
                                                block.id,
                                                itemIndex,
                                              )
                                            }
                                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-6 w-6 p-0"
                                          >
                                            <X className="w-3 h-3" />
                                          </Button>

                                          {/* Selector de ejercicio */}
                                          {activeExerciseSelector?.blockId === block.id &&
                                            activeExerciseSelector?.itemIndex === itemIndex &&
                                            !activeExerciseSelector?.subBlockId && (
                                            <div className="absolute right-0 top-8 z-20 bg-card border rounded-md shadow-lg p-2 w-64">
                                              <div className="flex items-center gap-2 mb-2">
                                                <Input
                                                  className="h-7 text-xs"
                                                  placeholder="Buscar ejercicio..."
                                                  value={exerciseSearch}
                                                  onChange={(e) => {
                                                    setExerciseSearch(e.target.value);
                                                    loadExercises();
                                                  }}
                                                  autoFocus
                                                />
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setActiveExerciseSelector(null)}
                                                  className="h-6 w-6 p-0"
                                                >
                                                  <X className="w-3 h-3" />
                                                </Button>
                                              </div>
                                              <div className="max-h-40 overflow-y-auto space-y-1">
                                                {exercises.length === 0 && (
                                                  <p className="text-xs text-muted-foreground px-2">No hay ejercicios</p>
                                                )}
                                                {exercises.map((ex) => (
                                                  <button
                                                    key={ex.id}
                                                    type="button"
                                                    onClick={() => assignExerciseToItem(block.id, itemIndex, ex)}
                                                    className="w-full text-left text-xs px-2 py-1.5 hover:bg-muted rounded flex items-center gap-2"
                                                  >
                                                    <span className="flex-1 truncate">{ex.name}</span>
                                                    {ex.video_url && <Play className="w-3 h-3 text-blue-500" />}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Input para agregar item directo */}
                                <div className="flex gap-2">
                                  <Input
                                    className="text-sm min-w-0 font-medium placeholder:text-sm h-auto"
                                    value={blockItemInputs[block.id] || ""}
                                    onChange={(e) =>
                                      setBlockItemInputs((prev) => ({
                                        ...prev,
                                        [block.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Agregar inciso..."
                                    onKeyDown={(e) => {
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
                                      !blockItemInputs[block.id]?.trim()
                                    }
                                    className="flex-shrink-0"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>

                                {/* Sub-bloques existentes */}
                                {block.subBlocks &&
                                  block.subBlocks.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                        <ChevronRight className="w-3 h-3" />
                                        Sub-bloques
                                      </p>
                                      {block.subBlocks.map((subBlock) => (
                                        <div
                                          key={subBlock.id}
                                          className="border border-border rounded-md p-3 space-y-2 bg-muted/20"
                                        >
                                          {/* Título del sub-bloque */}
                                          <div className="flex items-center gap-2">
                                            <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                            <Input
                                              value={subBlock.subtitle}
                                              onChange={(e) =>
                                                updateSubBlockTitle(
                                                  block.id,
                                                  subBlock.id,
                                                  e.target.value,
                                                )
                                              }
                                              placeholder="Nombre del sub-bloque..."
                                              className="text-sm font-medium h-7 flex-1"
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                removeSubBlock(
                                                  block.id,
                                                  subBlock.id,
                                                )
                                              }
                                              className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-6 w-6 p-0 flex-shrink-0"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>

                                          {/* Timer selector para el sub-bloque */}
                                          <div className="flex items-center gap-2 pl-6">
                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                            <Select
                                              value={subBlock.timer_mode || "none"}
                                              onValueChange={(value) =>
                                                updateSubBlockTimer(
                                                  block.id,
                                                  subBlock.id,
                                                  value === "none" ? null : value as any,
                                                )
                                              }
                                            >
                                              <SelectTrigger className="w-28 h-7 text-xs">
                                                <SelectValue placeholder="Sin timer" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">Sin timer</SelectItem>
                                                <SelectItem value="normal">Cronómetro</SelectItem>
                                                <SelectItem value="fortime">FOR TIME</SelectItem>
                                                <SelectItem value="amrap">AMRAP</SelectItem>
                                                <SelectItem value="emom">EMOM</SelectItem>
                                                <SelectItem value="otm">OTM</SelectItem>
                                                <SelectItem value="tabata">TABATA</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          {/* Timer config para el sub-bloque */}
                                          {subBlock.timer_mode === "tabata" && (
                                            <div className="grid grid-cols-3 gap-2 pl-6">
                                              <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Trabajo</Label>
                                                <Input
                                                  type="number"
                                                  value={subBlock.timer_config?.workTime || "20"}
                                                  onChange={(e) =>
                                                    updateSubBlockTimerConfig(block.id, subBlock.id, {
                                                      ...subBlock.timer_config,
                                                      workTime: e.target.value,
                                                    })
                                                  }
                                                  className="h-7 text-xs"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Descanso</Label>
                                                <Input
                                                  type="number"
                                                  value={subBlock.timer_config?.restTime || "10"}
                                                  onChange={(e) =>
                                                    updateSubBlockTimerConfig(block.id, subBlock.id, {
                                                      ...subBlock.timer_config,
                                                      restTime: e.target.value,
                                                    })
                                                  }
                                                  className="h-7 text-xs"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Rondas</Label>
                                                <Input
                                                  type="number"
                                                  value={subBlock.timer_config?.totalRounds || "8"}
                                                  onChange={(e) =>
                                                    updateSubBlockTimerConfig(block.id, subBlock.id, {
                                                      ...subBlock.timer_config,
                                                      totalRounds: e.target.value,
                                                    })
                                                  }
                                                  className="h-7 text-xs"
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {subBlock.timer_mode === "amrap" && (
                                            <div className="grid grid-cols-2 gap-2 pl-6">
                                              <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Tiempo</Label>
                                                <Input
                                                  type="number"
                                                  value={subBlock.timer_config?.amrapTime || "10"}
                                                  onChange={(e) =>
                                                    updateSubBlockTimerConfig(block.id, subBlock.id, {
                                                      ...subBlock.timer_config,
                                                      amrapTime: e.target.value,
                                                    })
                                                  }
                                                  className="h-7 text-xs"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Rondas</Label>
                                                <Input
                                                  type="number"
                                                  value={subBlock.timer_config?.totalRounds || "1"}
                                                  onChange={(e) =>
                                                    updateSubBlockTimerConfig(block.id, subBlock.id, {
                                                      ...subBlock.timer_config,
                                                      totalRounds: e.target.value,
                                                    })
                                                  }
                                                  className="h-7 text-xs"
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {(subBlock.timer_mode === "emom" || subBlock.timer_mode === "otm") && (
                                            <div className="grid grid-cols-2 gap-2 pl-6">
                                              <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Rondas</Label>
                                                <Input
                                                  type="number"
                                                  value={subBlock.timer_config?.totalRounds || "10"}
                                                  onChange={(e) =>
                                                    updateSubBlockTimerConfig(block.id, subBlock.id, {
                                                      ...subBlock.timer_config,
                                                      totalRounds: e.target.value,
                                                    })
                                                  }
                                                  className="h-7 text-xs"
                                                />
                                              </div>
                                              {subBlock.timer_mode === "otm" && (
                                                <div className="space-y-1">
                                                  <Label className="text-xs text-muted-foreground">Min/ronda</Label>
                                                  <Input
                                                    type="number"
                                                    value={subBlock.timer_config?.workTime || "2"}
                                                    onChange={(e) =>
                                                      updateSubBlockTimerConfig(block.id, subBlock.id, {
                                                        ...subBlock.timer_config,
                                                        workTime: e.target.value,
                                                      })
                                                    }
                                                    className="h-7 text-xs"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Items del sub-bloque */}
                                          <div className="space-y-1 pl-4">
                                            {subBlock.items.map(
                                              (item, itemIndex) => {
                                                const isEditing =
                                                  editingItem?.blockId ===
                                                    block.id &&
                                                  editingItem?.subBlockId ===
                                                    subBlock.id &&
                                                  editingItem?.itemIndex ===
                                                    itemIndex;
                                                return (
                                                  <div
                                                    key={itemIndex}
                                                    className="flex items-center gap-2 relative"
                                                  >
                                                    <span className="text-muted-foreground text-xs">
                                                      -
                                                    </span>
                                                    {isEditing ? (
                                                      <>
                                                        <Input
                                                          className="text-sm flex-1 h-7"
                                                          value={
                                                            editingItemValue
                                                          }
                                                          onChange={(e) =>
                                                            setEditingItemValue(
                                                              e.target.value,
                                                            )
                                                          }
                                                          onKeyPress={(e) => {
                                                            if (
                                                              e.key === "Enter"
                                                            ) {
                                                              e.preventDefault();
                                                              saveEditingItem();
                                                            } else if (
                                                              e.key === "Escape"
                                                            ) {
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
                                                          onClick={
                                                            saveEditingItem
                                                          }
                                                          disabled={
                                                            !editingItemValue.trim()
                                                          }
                                                          className="text-primary hover:text-primary-foreground hover:bg-primary h-6 w-6 p-0"
                                                        >
                                                          <Check className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={
                                                            cancelEditingItem
                                                          }
                                                          className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                                                        >
                                                          <X className="w-3 h-3" />
                                                        </Button>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <div className="flex-1">
                                                          <span
                                                            className="text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-0.5 -mx-2 inline-block"
                                                            onClick={() =>
                                                              startEditingItem(
                                                                block.id,
                                                                itemIndex,
                                                                subBlock.id,
                                                              )
                                                            }
                                                          >
                                                            {item.description}
                                                          </span>
                                                          {item.exerciseName && (
                                                            <span className="inline-flex items-center gap-1 ml-2 text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                                              <Play className="w-3 h-3" />
                                                              {item.exerciseName}
                                                              <button
                                                                type="button"
                                                                onClick={() => removeExerciseFromItem(block.id, itemIndex, subBlock.id)}
                                                                className="hover:text-blue-900 ml-1"
                                                              >
                                                                <X className="w-3 h-3" />
                                                              </button>
                                                            </span>
                                                          )}
                                                        </div>
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() =>
                                                            setActiveExerciseSelector({
                                                              blockId: block.id,
                                                              itemIndex,
                                                              subBlockId: subBlock.id,
                                                            })
                                                          }
                                                          className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                                                          title="Asignar ejercicio"
                                                        >
                                                          <Plus className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() =>
                                                            startEditingItem(
                                                              block.id,
                                                              itemIndex,
                                                              subBlock.id,
                                                            )
                                                          }
                                                          className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                                                        >
                                                          <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() =>
                                                            removeItemFromSubBlock(
                                                              block.id,
                                                              subBlock.id,
                                                              itemIndex,
                                                            )
                                                          }
                                                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-6 w-6 p-0"
                                                        >
                                                          <X className="w-3 h-3" />
                                                        </Button>

                                                        {/* Selector de ejercicio para sub-bloque */}
                                                        {activeExerciseSelector?.blockId === block.id &&
                                                          activeExerciseSelector?.itemIndex === itemIndex &&
                                                          activeExerciseSelector?.subBlockId === subBlock.id && (
                                                          <div className="absolute right-0 top-8 z-20 bg-card border rounded-md shadow-lg p-2 w-64">
                                                            <div className="flex items-center gap-2 mb-2">
                                                              <Input
                                                                className="h-7 text-xs"
                                                                placeholder="Buscar ejercicio..."
                                                                value={exerciseSearch}
                                                                onChange={(e) => {
                                                                  setExerciseSearch(e.target.value);
                                                                  loadExercises();
                                                                }}
                                                                autoFocus
                                                              />
                                                              <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setActiveExerciseSelector(null)}
                                                                className="h-6 w-6 p-0"
                                                              >
                                                                <X className="w-3 h-3" />
                                                              </Button>
                                                            </div>
                                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                              {exercises.length === 0 && (
                                                                <p className="text-xs text-muted-foreground px-2">No hay ejercicios</p>
                                                              )}
                                                              {exercises.map((ex) => (
                                                                <button
                                                                  key={ex.id}
                                                                  type="button"
                                                                  onClick={() => assignExerciseToItem(block.id, itemIndex, ex, subBlock.id)}
                                                                  className="w-full text-left text-xs px-2 py-1.5 hover:bg-muted rounded flex items-center gap-2"
                                                                >
                                                                  <span className="flex-1 truncate">{ex.name}</span>
                                                                  {ex.video_url && <Play className="w-3 h-3 text-blue-500" />}
                                                                </button>
                                                              ))}
                                                            </div>
                                                          </div>
                                                        )}
                                                      </>
                                                    )}
                                                  </div>
                                                );
                                              },
                                            )}

                                            {/* Input para agregar item al sub-bloque */}
                                            <div className="flex gap-2 mt-1">
                                              <Input
                                                className="text-sm h-7 placeholder:text-xs"
                                                value={
                                                  subBlockItemInputs[
                                                    `${block.id}::${subBlock.id}`
                                                  ] || ""
                                                }
                                                onChange={(e) => {
                                                  const key = `${block.id}::${subBlock.id}`;
                                                  setSubBlockItemInputs(
                                                    (prev) => ({
                                                      ...prev,
                                                      [key]: e.target.value,
                                                    }),
                                                  );
                                                }}
                                                placeholder="Agregar ejercicio..."
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addItemToSubBlock(
                                                      block.id,
                                                      subBlock.id,
                                                    );
                                                  }
                                                }}
                                              />
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  addItemToSubBlock(
                                                    block.id,
                                                    subBlock.id,
                                                  )
                                                }
                                                disabled={
                                                  !subBlockItemInputs[
                                                    `${block.id}::${subBlock.id}`
                                                  ]?.trim()
                                                }
                                                className="flex-shrink-0 h-7 w-7 p-0"
                                              >
                                                <Plus className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                {/* Input para agregar nuevo sub-bloque */}
                                <div className="mt-2 flex gap-2">
                                  <Input
                                    className="text-sm placeholder:text-xs h-auto"
                                    value={newSubBlockTitles[block.id] || ""}
                                    onChange={(e) =>
                                      setNewSubBlockTitles((prev) => ({
                                        ...prev,
                                        [block.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Nuevo sub-bloque (opcional)..."
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addSubBlock(block.id);
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addSubBlock(block.id)}
                                    disabled={
                                      !newSubBlockTitles[block.id]?.trim()
                                    }
                                    className="flex-shrink-0 h-auto"
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
                        )}
                      </SortableBlock>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

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

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

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
