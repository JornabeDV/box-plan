"use client";

import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePlanificationData } from "@/hooks/use-planification-data";
import { usePlanificationScores } from "@/hooks/use-planification-scores";
import { PlanificationHeader } from "@/components/planification/planification-header";
import { PlanificationBlocks } from "@/components/planification/planification-blocks";
import { PlanificationNotes } from "@/components/planification/planification-notes";
import { LevelPreferenceModal } from "@/components/planification/level-preference-modal";
import { DisciplineSelector } from "@/components/planification/discipline-selector";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { SubscriptionGate } from "@/components/subscription/subscription-gate";

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
  const searchParams = useSearchParams();

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
    needsLevel,
    setNeedsLevel,
    setSelectedLevelId,
    availableDisciplineOptions,
  } = usePlanificationData({ userId: user?.id });

  const showLevelModal = needsLevel;
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
      const response = await fetch(`/api/user-preferences/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_discipline_id: disciplineId,
          preferred_level_id: newLevelId,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar preferencia");

      await setSelectedLevelId(newLevelId);

      toast({
        title: "Nivel actualizado",
        description: "Tu preferencia ha sido actualizada",
      });
    } catch (error) {
      console.error("Error updating level:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el nivel",
        variant: "destructive",
      });
    }
  };

  const sortedBlocks = planification?.blocks || [];
  const hasBlocks = sortedBlocks.length > 0;
  const hasNotes = !!planification?.notes;
  const isStudent = user?.role === "student";

  const mainContent = (
    <>
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

      <DisciplineSelector
        selectedDisciplineId={disciplineId}
        onDisciplineChange={async (newDisciplineId) => {
          if (!user?.id || newDisciplineId === disciplineId) return;

          try {
            const response = await fetch(`/api/user-preferences/${user.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                preferred_discipline_id: newDisciplineId,
                preferred_level_id: null,
              }),
            });

            if (!response.ok) throw new Error("Error al actualizar preferencia");

            const params = new URLSearchParams(searchParams.toString());
            if (newDisciplineId) {
              params.set("disciplineId", newDisciplineId.toString());
            } else {
              params.delete("disciplineId");
            }
            router.replace(`/planification?${params.toString()}`, {
              scroll: false,
            });

            toast({
              title: "Disciplina actualizada",
              description: "Tu preferencia ha sido actualizada",
            });
          } catch (error) {
            console.error("Error updating discipline:", error);
            toast({
              title: "Error",
              description: "No se pudo actualizar la disciplina",
              variant: "destructive",
            });
          }
        }}
        availableDisciplineOptions={availableDisciplineOptions}
      />

      {planification && (
        <div className="space-y-6">
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
        </div>
      )}

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
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="p-6 space-y-6 pb-32 max-w-4xl mx-auto">
        {isStudent ? (
          <SubscriptionGate>{mainContent}</SubscriptionGate>
        ) : (
          mainContent
        )}
      </main>

      <BottomNavigation />

      {showLevelModal && (
        <LevelPreferenceModal
          open={true}
          disciplineId={disciplineId || 0}
          disciplineName={disciplineName}
          onClose={() => {}}
          onLevelSelected={(levelId) => {
            if (user?.id) {
              fetch(`/api/user-preferences/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  preferred_discipline_id: disciplineId,
                  preferred_level_id: levelId,
                }),
              })
                .then(() => {
                  setNeedsLevel(false);
                  setSelectedLevelId(levelId);
                  toast({
                    title: "Nivel guardado",
                    description: "Tu preferencia ha sido actualizada",
                  });
                })
                .catch((err) => {
                  console.error("Error:", err);
                  toast({
                    title: "Error",
                    description: "No se pudo guardar la preferencia",
                    variant: "destructive",
                  });
                });
            }
          }}
        />
      )}
    </div>
  );
}
