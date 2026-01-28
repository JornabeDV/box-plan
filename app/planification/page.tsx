"use client";

import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { usePlanificationData } from "@/hooks/use-planification-data";
import { usePlanificationScores } from "@/hooks/use-planification-scores";
import { PlanificationHeader } from "@/components/planification/planification-header";
import { PlanificationBlocks } from "@/components/planification/planification-blocks";
import { PlanificationNotes } from "@/components/planification/planification-notes";
import { PlanificationEmptyState } from "@/components/planification/planification-empty-state";
import { PlanificationLoading } from "@/components/planification/planification-loading";
import { WodScoreForm } from "@/components/planification/wod-score-form";
import { StrengthScoreForm } from "@/components/planification/strength-score-form";
import { CheckCircle } from "lucide-react";

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
  const {
    planification,
    loading,
    selectedDate,
    existingWodWorkout,
    existingStrengthWorkout,
    setExistingWodWorkout,
    setExistingStrengthWorkout,
  } = usePlanificationData({ userId: user?.id });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <PlanificationLoading />
        <BottomNavigation />
      </div>
    );
  }

  if (!planification) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="p-6 space-y-8 pb-32 max-w-4xl mx-auto">
          <PlanificationHeader
            selectedDate={selectedDate}
            isToday={isToday}
            formattedDate={formattedDate}
          />
          <PlanificationEmptyState
            isToday={isToday}
            formattedDate={formattedDate}
          />
        </main>
        <BottomNavigation />
      </div>
    );
  }

  const sortedBlocks = planification.blocks || [];
  const hasBlocks = sortedBlocks.length > 0;
  const hasNotes = !!planification.notes;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="p-6 space-y-6 pb-32 max-w-4xl mx-auto">
        <PlanificationHeader
          selectedDate={selectedDate}
          isToday={isToday}
          formattedDate={formattedDate}
        />

        {/* Indicador de planificación personalizada */}
        {planification.is_personalized && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 text-purple-500"
                >
                  <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
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

        {/* Sección de registro de scores */}
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
      </main>

      <BottomNavigation />
    </div>
  );
}
