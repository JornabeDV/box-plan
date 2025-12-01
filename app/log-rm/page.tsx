"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCoachPlanFeatures } from "@/hooks/use-coach-plan-features";
import { useRMs } from "@/hooks/use-rms";
import { useExercises } from "@/hooks/use-exercises";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { RMHeader } from "@/components/rm/rm-header";
import { RMList } from "@/components/rm/rm-list";
import { RMModal } from "@/components/rm/rm-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CargaRMPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { canLoadScores, loading: planFeaturesLoading } =
    useCoachPlanFeatures();
  const {
    logMultipleRMs,
    rmRecords,
    loading: rmsLoading,
    fetchRMs,
    deleteRM,
    updateRM,
  } = useRMs();
  const { exerciseNames } = useExercises();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rmToDelete, setRmToDelete] = useState<{
    id: number;
    exercise: string;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rmToEdit, setRmToEdit] = useState<{
    id: number;
    exercise: string;
    weight: number;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewRMClick = () => {
    setIsEditMode(false);
    setRmToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (rm: {
    id: number;
    exercise: string;
    weight: number;
  }) => {
    setRmToEdit(rm);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number, exercise: string) => {
    setRmToDelete({ id, exercise });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rmToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteRM(rmToDelete.id);
      if (success) {
        toast({
          title: "RM eliminado",
          description: "El RM se eliminó correctamente",
        });
        setIsDeleteDialogOpen(false);
        setRmToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting RM:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el RM. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSubmit = async (
    rmData: Array<{ exercise: string; weight: number; recorded_at: string }>
  ) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para cargar RMs",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && rmToEdit) {
        // Modo edición: actualizar un solo RM
        const updated = await updateRM(rmToEdit.id, {
          exercise: rmData[0].exercise,
          weight: rmData[0].weight,
          recorded_at: rmData[0].recorded_at,
        });

        if (updated) {
          toast({
            title: "¡RM actualizado!",
            description: "El RM se actualizó correctamente",
          });
          setIsModalOpen(false);
          setIsEditMode(false);
          setRmToEdit(null);
          await fetchRMs();
        }
      } else {
        // Modo creación: guardar múltiples RMs
        await logMultipleRMs(rmData);

        toast({
          title: "¡RMs guardados!",
          description: `Se registraron ${rmData.length} repetición${
            rmData.length > 1 ? "es" : ""
          } máxima${rmData.length > 1 ? "s" : ""} exitosamente`,
        });

        setIsModalOpen(false);
        await fetchRMs();
      }
    } catch (error) {
      console.error("Error saving RMs:", error);
      toast({
        title: "Error",
        description: isEditMode
          ? "No se pudo actualizar el RM. Intenta nuevamente."
          : "No se pudieron guardar los RMs. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setRmToEdit(null);
  };

  useEffect(() => {
    if (user?.id) {
      fetchRMs();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || planFeaturesLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">No autorizado</h2>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (!canLoadScores) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="p-6 pb-32 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Funcionalidad no disponible
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                La carga de Repeticiones Máximas (RM) no está incluida en tu
                plan actual.
              </p>
              <p className="text-sm text-muted-foreground">
                Para acceder a esta funcionalidad, necesitas un plan que incluya
                la carga de scores.
              </p>
              <Button
                onClick={() => router.push("/subscription")}
                className="w-full"
              >
                Ver Planes Disponibles
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="p-6 space-y-6 pb-32 max-w-4xl mx-auto">
        <RMHeader onNewRMClick={handleNewRMClick} />

        <RMList
          rmRecords={rmRecords}
          loading={rmsLoading}
          onNewRMClick={handleNewRMClick}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />

        <RMModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSubmit={handleModalSubmit}
          exerciseNames={exerciseNames}
          isEditMode={isEditMode}
          initialRM={rmToEdit}
          loading={isSubmitting}
        />

        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="Eliminar Repetición Máxima"
          description={
            rmToDelete
              ? `¿Estás seguro de que quieres eliminar el RM de "${rmToDelete.exercise}"? Esta acción no se puede deshacer.`
              : "¿Estás seguro de que quieres eliminar este RM?"
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
          loading={isDeleting}
        />
      </main>

      <BottomNavigation />
    </div>
  );
}
