"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Weight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useCoachPlanFeatures } from "@/hooks/use-coach-plan-features";

interface RMListProps {
  rmRecords: any[];
}

export function RMList({ rmRecords }: RMListProps) {
  const router = useRouter();
  const { canLoadScores } = useCoachPlanFeatures();

  if (!rmRecords || rmRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Weight className="w-5 h-5" />
              Mis Repeticiones Máximas
            </CardTitle>
            {canLoadScores && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/log-rm")}
                className="flex items-center gap-2"
              >
                <Weight className="w-4 h-4" />
                Agregar RM
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Weight className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay RMs registrados aún</p>
            {canLoadScores && (
              <Button className="mt-4" onClick={() => router.push("/log-rm")}>
                Registrar Primer RM
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar RMs por ejercicio y obtener el más reciente de cada uno
  const exercisesMap = new Map<string, any>();

  rmRecords.forEach((rm: any) => {
    const exercise = rm.exercise;
    if (!exercise) return;
    if (!exercisesMap.has(exercise)) {
      exercisesMap.set(exercise, []);
    }
    exercisesMap.get(exercise)!.push(rm);
  });

  // Ordenar cada grupo por fecha (más reciente primero)
  exercisesMap.forEach((records) => {
    records.sort((a: any, b: any) => {
      const dateA = new Date(a.recordedAt).getTime();
      const dateB = new Date(b.recordedAt).getTime();
      return dateB - dateA;
    });
  });

  // Convertir a array y ordenar por ejercicio
  const exercises = Array.from(exercisesMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Weight className="w-5 h-5" />
            Mis Repeticiones Máximas
          </CardTitle>
          {canLoadScores && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/log-rm")}
              className="flex items-center gap-2"
            >
              <Weight className="w-4 h-4" />
              Agregar RM
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {exercises.map(([exercise, records]) => {
            const latestRM = records[0];
            const weight = Number(latestRM.weight);
            const recordedAt = latestRM.recordedAt;
            const hasHistory = records.length > 1;
            const previousRM = hasHistory ? records[1] : null;
            const previousWeight = previousRM
              ? Number(previousRM.weight)
              : null;
            const improvement =
              previousWeight !== null ? weight - previousWeight : null;

            return (
              <div
                key={exercise}
                className="flex items-center justify-between p-4 bg-card rounded-lg border"
              >
                <div className="flex-1">
                  <div className="font-semibold text-lg">{exercise}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {recordedAt
                      ? formatDistanceToNow(new Date(recordedAt), {
                          addSuffix: true,
                          locale: es,
                        })
                      : "Fecha no disponible"}
                  </div>
                  {hasHistory && improvement !== null && (
                    <div
                      className={`text-xs mt-1 ${
                        improvement > 0
                          ? "text-green-400"
                          : improvement < 0
                          ? "text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {improvement > 0 && "↑ "}
                      {improvement < 0 && "↓ "}
                      {improvement === 0 && "→ "}
                      {Math.abs(improvement).toFixed(1)} kg vs anterior
                      {records.length > 2 && ` (${records.length} registros)`}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-lime-400">
                    {weight} kg
                  </div>
                  <div className="text-xs text-muted-foreground">RM Actual</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
