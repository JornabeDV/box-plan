"use client";

import { useState, useEffect } from "react";
import { FullCalendar } from "@/components/dashboard/full-calendar";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { DisciplineSelector } from "@/components/planification/discipline-selector";
import { useUserDisciplines } from "@/hooks/use-user-disciplines";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { RequireActiveSubscription } from "@/components/auth/require-active-subscription";

export default function CalendarPage() {
  const router = useRouter();
  const { disciplines, loading: disciplinesLoading } = useUserDisciplines();
  const { hasPersonalizedWorkouts, loading: subscriptionLoading } = useStudentSubscription();
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(null);

  // Inicializar con la primera disciplina disponible
  useEffect(() => {
    if (!disciplinesLoading && disciplines.length > 0 && selectedDisciplineId === null) {
      setSelectedDisciplineId(disciplines[0].disciplineId);
    }
  }, [disciplines, disciplinesLoading, selectedDisciplineId]);

  const availableDisciplineOptions = disciplines.map((ud) => ({
    id: ud.disciplineId,
    name: ud.discipline?.name || "Sin nombre",
    color: ud.discipline?.color || "#3B82F6",
    levelId: ud.levelId,
    levelName: ud.level?.name || null,
  }));

  const selectedDiscipline = availableDisciplineOptions.find(
    (d) => d.id === selectedDisciplineId
  );

  // Si el atleta tiene plan personalizado, no mostrar selector de disciplina
  const showDisciplineSelector =
    !disciplinesLoading &&
    !subscriptionLoading &&
    disciplines.length > 0 &&
    !hasPersonalizedWorkouts;

  return (
    <RequireActiveSubscription>
    <div className="min-h-screen pb-24">
      <main className="px-5 py-6 space-y-8 max-w-md mx-auto md:max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="h-11 w-11 rounded-none bg-primary/5 border-primary/50 text-primary hover:bg-primary/10 shrink-0"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
                Vista General
              </p>
              <h1 className="text-3xl md:text-4xl font-bold italic text-primary">
                Calendario
              </h1>
            </div>
          </div>
        </div>

        {/* Selector de disciplina (solo si tiene disciplinas asignadas) */}
        {showDisciplineSelector && (
          <div className="flex justify-center">
            <DisciplineSelector
              selectedDisciplineId={selectedDisciplineId}
              onDisciplineChange={setSelectedDisciplineId}
              disabled={disciplinesLoading}
              availableDisciplineOptions={availableDisciplineOptions}
            />
          </div>
        )}

        {/* Calendario */}
        <FullCalendar discipline={selectedDiscipline} />
      </main>

      <BottomNavigation />
    </div>
    </RequireActiveSubscription>
  );
}
