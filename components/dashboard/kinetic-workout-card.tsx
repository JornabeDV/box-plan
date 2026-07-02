"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTodayPlanification } from "@/hooks/use-today-planification";
import { Dumbbell, ArrowRight, Zap, Star } from "lucide-react";

interface KineticWorkoutCardProps {
  preferredDisciplineName?: string | null;
  preferredLevelName?: string | null;
}

export function KineticWorkoutCard({
  preferredDisciplineName,
  preferredLevelName,
}: KineticWorkoutCardProps) {
  const router = useRouter();
  const { planifications, loading } = useTodayPlanification();

  const primary = planifications?.primary;
  const others = planifications?.others || [];

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

  // Sin ninguna planificación para hoy
  if (!primary && others.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-5">
          <span className="label-md text-muted-foreground">
            Planificación de hoy
          </span>
          <h3 className="headline-md text-foreground">Descanso Activo</h3>
          <p className="body-sm text-muted-foreground">
            No hay entrenamiento programado para hoy en ninguna de tus
            disciplinas. Aprovechá para recuperarte.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleStart = (disciplineId?: number) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const base = `/planification?date=${year}-${month}-${day}`;
    router.push(disciplineId ? `${base}&disciplineId=${disciplineId}` : base);
  };

  // Render de una card de planificación individual
  const PlanCard = ({
    plan,
    isMain = false,
  }: {
    plan: (typeof others)[number];
    isMain?: boolean;
  }) => {
    const firstBlock = plan.blocks?.[0];
    const duration = plan.estimatedDuration;

    return (
      <Card
        className={
          isMain ? "" : "border-dashed border-outline/40 bg-surface-container/50"
        }
      >
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {isMain && (
                <span className="label-md text-muted-foreground block mb-1">
                  Entrenamiento de hoy
                </span>
              )}
              <h3 className="text-lg font-bold text-primary uppercase tracking-wide">
                {plan.discipline?.name || "Entrenamiento"} Personalizado
                {plan.discipline_level?.name && (
                  <span className="block text-foreground mt-0.5 text-base normal-case tracking-normal font-semibold">
                    {plan.discipline_level.name}
                  </span>
                )}
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

          <Button
            size="lg"
            className="w-full uppercase tracking-[0.15em]"
            onClick={() => handleStart(plan.disciplineId)}
          >
            Comenzar Sesión
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Clasificar others cuando no hay primary
  const sameDisciplineOthers = !primary
    ? others.filter(
        (p) =>
          preferredDisciplineName &&
          p.discipline?.name?.toLowerCase() ===
            preferredDisciplineName.toLowerCase()
      )
    : [];

  const otherDisciplineOthers = !primary
    ? others.filter(
        (p) =>
          !preferredDisciplineName ||
          p.discipline?.name?.toLowerCase() !==
            preferredDisciplineName.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="headline-md text-foreground">
          <span className="italic">Planificación</span>{" "}
          <span className="text-primary italic">de hoy</span>
        </h2>
      </div>

      {/* Planificación principal */}
      {primary && <PlanCard plan={primary} isMain />}

      {/* Estado: sin planificación para la preferida pero sí para otra/s */}
      {!primary && others.length > 0 && (
        <div className="space-y-4">
          {/* Info card contextual */}
          <Card className="bg-surface-container/60 border-outline/20">
            <CardContent className="pt-5 space-y-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="label-md text-muted-foreground">
                  {preferredDisciplineName && preferredLevelName
                    ? `Hoy no tenés ${preferredDisciplineName} ${preferredLevelName}`
                    : preferredDisciplineName
                    ? `Hoy descansás de ${preferredDisciplineName}`
                    : "Hoy descansás de tu disciplina preferida"}
                </span>
              </div>
              <p className="body-sm text-muted-foreground">
                {sameDisciplineOthers.length > 0
                  ? `No hay entrenamiento para tu nivel, pero tenés para otro nivel de ${preferredDisciplineName}.`
                  : otherDisciplineOthers.length > 0
                  ? "No hay entrenamiento programado para tu disciplina preferida, pero tenés en otra disciplina."
                  : "No hay entrenamiento programado para hoy."}
              </p>
            </CardContent>
          </Card>

          {/* Planificaciones del mismo nivel (otro nivel de la preferida) */}
          {sameDisciplineOthers.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}

          {/* Planificaciones de otras disciplinas */}
          {otherDisciplineOthers.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      {/* Others cuando sí hay primary */}
      {primary && others.length > 0 && (
        <div className="space-y-2">
          <p className="label-md text-muted-foreground">También tenés hoy:</p>
          <div className="flex flex-wrap gap-2">
            {others.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handleStart(plan.disciplineId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors text-sm font-medium text-foreground border border-border"
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>{plan.discipline?.name || "Entrenamiento"}</span>
                {plan.discipline_level?.name && (
                  <span className="text-muted-foreground">
                    — {plan.discipline_level.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
