"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, Play, Dumbbell } from "lucide-react";
import { useCoachExercises } from "@/hooks/use-coach-exercises";
import { useToast } from "@/hooks/use-toast";

interface ExercisesManagerProps {
  coachId?: string | null;
}

export function ExercisesManager({ coachId }: ExercisesManagerProps) {
  const {
    exercises,
    loading,
    loadExercises,
    createExercise,
    updateExercise,
    deleteExercise,
  } = useCoachExercises();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    video_url: "",
  });

  useEffect(() => {
    if (coachId) {
      loadExercises(search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId, search]);

  const resetForm = () => {
    setFormData({ name: "", category: "", description: "", video_url: "" });
    setEditingExercise(null);
  };

  const handleOpenModal = (exercise?: any) => {
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        name: exercise.name || "",
        category: exercise.category || "",
        description: exercise.description || "",
        video_url: exercise.video_url || "",
      });
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Nombre requerido",
        description: "El ejercicio debe tener un nombre",
        variant: "destructive",
      });
      return;
    }

    if (editingExercise) {
      const result = await updateExercise(editingExercise.id, formData);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Ejercicio actualizado" });
        setModalOpen(false);
        resetForm();
      }
    } else {
      const result = await createExercise(formData);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Ejercicio creado" });
        setModalOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (exercise: any) => {
    const confirmed = window.confirm(
      `¿Eliminar el ejercicio "${exercise.name}"?`
    );
    if (!confirmed) return;

    const result = await deleteExercise(exercise.id);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: "Ejercicio eliminado" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Biblioteca de Ejercicios</h2>
          <p className="text-muted-foreground text-sm">
            Gestiona los ejercicios con videos que podés usar en las
            planificaciones.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ejercicio
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          className="pl-10"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          Cargando ejercicios...
        </div>
      )}

      {!loading && exercises.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">
            No hay ejercicios aún
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Creá tu primer ejercicio con video para usar en las
            planificaciones.
          </p>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Ejercicio
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{exercise.name}</h3>
                  {exercise.category && (
                    <span className="text-xs text-muted-foreground">
                      {exercise.category}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {exercise.video_url && (
                    <a
                      href={exercise.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:bg-blue-50"
                      title="Ver video"
                    >
                      <Play className="w-4 h-4" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleOpenModal(exercise)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => handleDelete(exercise)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {exercise.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {exercise.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal para crear/editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}
            </DialogTitle>
            <DialogDescription>
              {editingExercise
                ? "Actualizá los datos del ejercicio"
                : "Creá un ejercicio para usar en tus planificaciones"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="ej: Back Squat"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="ej: Fuerza - Lower Body"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url">URL del video (YouTube)</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    video_url: e.target.value,
                  }))
                }
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Breve descripción del ejercicio"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingExercise ? "Guardar Cambios" : "Crear Ejercicio"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
