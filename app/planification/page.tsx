"use client";

import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePlanificationData } from "@/hooks/use-planification-data";
import { usePlanificationScores } from "@/hooks/use-planification-scores";
import { PlanificationHeader } from "@/components/planification/planification-header";
import { PlanificationBlocks } from "@/components/planification/planification-blocks";
import { PlanificationNotes } from "@/components/planification/planification-notes";
import { WodScoreForm } from "@/components/planification/wod-score-form";
import { StrengthScoreForm } from "@/components/planification/strength-score-form";
import { LevelPreferenceModal } from "@/components/planification/level-preference-modal";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Lock } from "lucide-react";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const isSameDate = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export default function PlanificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { canTrackProgress, loading: subscriptionLoading } = useStudentSubscription();
  const {
    planification,
    loading,
    selectedDate,
    existingWodWorkout,
    existingStrengthWorkout,
    setExistingWodWorkout,
    setExistingStrengthWorkout,
    disciplineId,
    disciplineName,
    levels,
    selectedLevelId,
    setSelectedLevelId,
  } = usePlanificationData({ userId: user?.id });
/*  */  
  // El modal se muestra si hay disciplina pero no hay nivel seleccionado
  const showLevelModal = !!disciplineId && !selectedLevelId;

  const { handleSaveWodScore, handleSaveStrengthScore } =
    usePlanificationScores({
      planificationId: planification?.id,
      userId: user?.id,
      existingWodWorkout,
      existingStrengthWorkout,
      onWodWorkoutUpdate: setExistingWodWorkout,
      onStrengthWorkoutUpdate: setExistingStrengthWorkout,
    });

  const isToday = isSameDate(selectedDate, new Date());
  const formattedDate = !isToday
    ? formatDate(selectedDate.toISOString().split("T")[0] + "T00:00:00")
    : undefined;



  const handleLevelChange = async (newLevelId: number) => {
    if (!user?.id || newLevelId === selectedLevelId) return;

    try {
      // Actualizar preferencia en BD (solo el nivel, no la disciplina)
      const response = await fetch(`/api/user-preferences/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_discipline_id: disciplineId,
          preferred_level_id: newLevelId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403 && errorData.message) {
          toast({
            title: 'Cambio bloqueado',
            description: errorData.message,
            variant: 'destructive'
          });
          return;
        }
        throw new Error('Error al actualizar preferencia');
      }

      // Recargar con el nuevo nivel (sin refrescar la página)
      await setSelectedLevelId(newLevelId);
      
      toast({
        title: 'Nivel actualizado',
        description: 'Tu preferencia ha sido actualizada'
      });
    } catch (error) {
      console.error('Error updating level:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el nivel',
        variant: 'destructive'
      });
    }
  };

  const sortedBlocks = planification?.blocks || [];
  const hasBlocks = sortedBlocks.length > 0;
  const hasNotes = !!planification?.notes;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="p-6 space-y-6 pb-32 max-w-4xl mx-auto">
        <PlanificationHeader
          selectedDate={selectedDate}
          isToday={isToday}
          formattedDate={formattedDate}
          levels={levels}
          selectedLevelId={selectedLevelId}
          onLevelChange={handleLevelChange}
          disciplineName={disciplineName}
          isPersonalized={planification?.is_personalized}
        />

        {/* Contenido solo si hay planificación */}
        {planification && (
          <div className="space-y-6">
            {/* Indicador de planificación personalizada */}
            {planification.is_personalized && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="max-sm:text-base font-semibold text-purple-700 dark:text-purple-300 mb-1">
                      Planificación Personalizada
                    </h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      Esta rutina fue creada específicamente para ti por tu coach.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasBlocks && (
              <PlanificationBlocks
                blocks={sortedBlocks}
                disciplineColor={planification.discipline?.color}
              />
            )}

            {planification.notes && (
              <PlanificationNotes notes={planification.notes} />
            )}

            {!hasBlocks && !hasNotes && (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-zinc-300">
                    No hay detalles adicionales para esta planificación
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sección de registro de scores - solo si tiene progressTracking */}
              {/* {canTrackProgress ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
                    <CheckCircle className="w-6 h-6 text-lime-400" />
                    Registro de Scores
                  </h3>

                  <WodScoreForm
                    planificationId={planification.id}
                    existingWorkout={existingWodWorkout}
                    onSave={handleSaveWodScore}
                  />

                  <StrengthScoreForm
                    planificationId={planification.id}
                    existingWorkout={existingStrengthWorkout}
                    onSave={handleSaveStrengthScore}
                  />
                </div>
              ) : (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lock className="w-5 h-5" />
                      Registro de Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      El registro de scores no está incluido en tu plan actual.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/subscription")}
                      className="w-full"
                    >
                      Ver Planes Disponibles
                    </Button>
                  </CardContent>
                </Card>
              )} */}
          </div>
        )}

      {/* Mensaje si no hay bloques ni notas */}
      {!loading && planification && sortedBlocks.length === 0 && !planification.notes && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-zinc-300">
              No hay detalles adicionales para esta planificación
            </p>
          </CardContent>
        </Card>
      )}

      {/* Estado vacío cuando no hay planificación pero sí hay nivel seleccionado */}
      {!loading && !planification && selectedLevelId && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-zinc-300 mb-4">
              No hay planificación para este nivel en la fecha seleccionada
            </p>
            <p className="text-sm text-muted-foreground">
              Probá cambiando a otro nivel usando el selector de arriba
            </p>
          </CardContent>
        </Card>
      )}
      </main>

      <BottomNavigation />
      
      {/* Modal para seleccionar nivel - solo si no tiene nivel preferido */}
      {showLevelModal && (
        <LevelPreferenceModal
          open={true}
          disciplineId={disciplineId || 0}
          disciplineName={disciplineName}
          onClose={() => {}}
          onLevelSelected={(levelId) => {
            if (user?.id) {
              fetch(`/api/user-preferences/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  preferred_discipline_id: disciplineId,
                  preferred_level_id: levelId
                })
              }).then(() => {
                setSelectedLevelId(levelId);
                toast({
                  title: 'Nivel guardado',
                  description: 'Tu preferencia ha sido actualizada'
                });
              }).catch((err) => {
                console.error('Error:', err);
                toast({
                  title: 'Error',
                  description: 'No se pudo guardar la preferencia',
                  variant: 'destructive'
                });
              });
            }
          }}
        />
      )}
    </div>
  );
}
