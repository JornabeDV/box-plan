"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAllTodayPlanifications } from "@/hooks/use-all-today-planifications";
import { Dumbbell, ArrowRight, Timer } from "lucide-react";

interface UserDiscipline {
  disciplineId: number;
  discipline?: {
    id: number;
    name: string;
    color: string;
  } | null;
  level?: {
    id: number;
    name: string;
  } | null;
}

interface TodayPlanificationCardsProps {
  userDisciplines: UserDiscipline[];
}

export function TodayPlanificationCards({
  userDisciplines,
}: TodayPlanificationCardsProps) {
  const router = useRouter();
  const { planifications, loading } = useAllTodayPlanifications({
    enabled: userDisciplines.length > 0,
  });

  const handleStart = (disciplineId: number) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    router.push(
      `/planification?date=${year}-${month}-${day}&disciplineId=${disciplineId}`,
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {userDisciplines.map((ud) => (
          <Card key={ud.disciplineId} className="animate-pulse">
            <CardContent className="space-y-4 pt-5">
              <div className="h-4 bg-surface-container-high rounded w-1/3" />
              <div className="h-8 bg-surface-container-high rounded w-2/3" />
              <div className="h-20 bg-surface-container-high rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="headline-md text-foreground">
          <span className="italic">Planificación</span>{" "}
          <span className="text-primary italic">de hoy</span>
        </h2>
      </div>

      {userDisciplines.map((ud) => {
        const plan = planifications.find(
          (p) => Number(p.discipline_id) === ud.disciplineId,
        );

        if (!plan) {
          return (
            <Card key={ud.disciplineId}>
              <CardContent className="space-y-3">
                <h3 className="text-lg font-bold text-primary uppercase tracking-wide">
                  {ud.discipline?.name || "Disciplina"}: Sin planificación
                </h3>
                <p className="body-sm text-muted-foreground">
                  No hay entrenamiento programado para{" "}
                  {ud.discipline?.name || "esta disciplina"} hoy.
                </p>
              </CardContent>
            </Card>
          );
        }

        const firstBlock = plan.blocks?.[0];
        const duration = plan.estimatedDuration;

        return (
          <Card key={ud.disciplineId}>
            <CardContent className="space-y-4">
              {/* Disciplina */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-primary uppercase tracking-wide">
                    {plan.discipline?.name ||
                      ud.discipline?.name ||
                      "Entrenamiento"}
                  </h3>
                  {plan.title && (
                    <p className="body-sm text-foreground mt-1 truncate">
                      {plan.title}
                    </p>
                  )}
                </div>
                {duration && (
                  <div className="text-right shrink-0">
                    <span className="display-sm text-primary">{duration}</span>
                    <span className="label-md text-muted-foreground block">
                      Duración
                    </span>
                  </div>
                )}
              </div>

              {/* Equipamiento */}
              {firstBlock?.description && (
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="label-md text-muted-foreground">
                    Equipamiento
                  </span>
                  <span className="body-sm text-foreground font-medium">
                    {firstBlock.description}
                  </span>
                </div>
              )}

              {/* CTA */}
              <Button
                size="lg"
                className="w-full uppercase tracking-[0.15em]"
                onClick={() => handleStart(ud.disciplineId)}
              >
                Comenzar Sesión
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
