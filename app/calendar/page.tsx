"use client";

import { useState, useEffect } from "react";
import { FullCalendar } from "@/components/dashboard/full-calendar";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { DisciplineSelector } from "@/components/planification/discipline-selector";
import { useUserDisciplines } from "@/hooks/use-user-disciplines";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { RequireActiveSubscription } from "@/components/auth/require-active-subscription";

export default function CalendarPage() {
  const router = useRouter();
  const { disciplines, loading: disciplinesLoading } = useUserDisciplines();
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

  return (
    <RequireActiveSubscription>
    <div className="min-h-screen pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
              Vista General
            </p>
            <h1 className="text-2xl md:text-3xl font-bold italic text-primary">
              Calendario Completo
            </h1>
          </div>
        </div>

        {/* Selector de disciplina */}
        <div className="flex justify-center">
          <DisciplineSelector
            selectedDisciplineId={selectedDisciplineId}
            onDisciplineChange={setSelectedDisciplineId}
            disabled={disciplinesLoading}
            availableDisciplineOptions={availableDisciplineOptions}
          />
        </div>

        {/* Calendario */}
        <FullCalendar discipline={selectedDiscipline} />
      </div>

      <BottomNavigation />
    </div>
    </RequireActiveSubscription>
  );
}
