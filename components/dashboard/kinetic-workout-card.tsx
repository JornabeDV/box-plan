"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTodayPlanification } from "@/hooks/use-today-planification";
import { Flame, Timer, Dumbbell, ArrowRight } from "lucide-react";

function IntensityBars({ level = 3 }: { level?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i <= level ? "bg-primary w-4" : "bg-outline w-4"
          }`}
        />
      ))}
    </div>
  );
}

export function KineticWorkoutCard() {
  const router = useRouter();
  const { planification, loading } = useTodayPlanification();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="space-y-4 pt-5">
          <div className="h-4 bg-surface-container-high rounded w-1/3" />
          <div className="h-8 bg-surface-container-high rounded w-2/3" />
          <div className="h-20 bg-surface-container-high rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!planification) {
    return (
      <Card>
        <CardContent className="space-y-2">
          <span className="label-md text-muted-foreground">Planificación de hoy</span>
          <h3 className="headline-md text-foreground">Descanso Activo</h3>
          <p className="body-sm text-muted-foreground">
            No hay entrenamiento programado para hoy. Aprovechá para recuperarte.
          </p>
        </CardContent>
      </Card>
    );
  }

  const firstBlock = planification.blocks?.[0];
  const blockCount = planification.blocks?.length || 0;
  const duration = planification.estimatedDuration;

  const handleStart = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    router.push(`/planification?date=${year}-${month}-${day}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="headline-md text-foreground">
          <span className="italic">Planificación</span>{" "}
          <span className="text-primary italic">de hoy</span>
        </h2>
        <Badge>Active</Badge>
      </div>

      {/* Main Card */}
      <Card>
        <CardContent className="space-y-5 pt-5">
          {/* Title + Duration */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="label-md text-muted-foreground block mb-1">
                Entrenamiento Principal
              </span>
              <h3 className="text-lg font-bold text-primary uppercase tracking-wide">
                {planification.discipline?.name || "Entrenamiento"}
                {planification.disciplineLevel?.name && (
                  <span className="block text-foreground mt-0.5">
                    {planification.disciplineLevel.name}
                  </span>
                )}
              </h3>
            </div>
            {duration && (
              <div className="text-right shrink-0">
                <span className="display-sm text-primary">{duration}</span>
                <span className="label-md text-muted-foreground block">Duración</span>
              </div>
            )}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-container-high p-3">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span className="label-md">Intensidad</span>
              </div>
              <IntensityBars level={3} />
            </div>
            <div className="rounded-xl bg-surface-container-high p-3">
              <div className="flex items-center gap-2 mb-1">
                <Timer className="w-3.5 h-3.5 text-primary" />
                <span className="label-md">Calorías Est.</span>
              </div>
              <p className="text-lg font-bold text-foreground">450 kcal</p>
            </div>
          </div>

          {/* Equipment */}
          {firstBlock?.description && (
            <div className="flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="label-md text-muted-foreground">Equipamiento</span>
              <span className="body-sm text-foreground font-medium">
                {firstBlock.description}
              </span>
            </div>
          )}

          {/* CTA */}
          <Button size="lg" className="w-full uppercase tracking-[0.15em]" onClick={handleStart}>
            Comenzar Sesión
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Blocks count */}
      {blockCount > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {String(blockCount).padStart(2, "0")} Bloques Totales
        </p>
      )}
    </div>
  );
}
