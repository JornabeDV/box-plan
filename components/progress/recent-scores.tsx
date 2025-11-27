"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface RecentScoresProps {
  workouts: any[];
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export function RecentScores({ workouts }: RecentScoresProps) {
  const router = useRouter();

  // Filtrar solo scores (wod_score y strength_score) y ordenar por fecha
  const scores = (workouts || [])
    .filter((w: any) => {
      if (!w.data) return false;
      const data = w.data as any;
      return data.type === "wod_score" || data.type === "strength_score";
    })
    .slice(0, 5);

  if (scores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Scores Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay scores registrados aún</p>
            <Button
              className="mt-4"
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, "0");
                const day = String(today.getDate()).padStart(2, "0");
                const dateString = `${year}-${month}-${day}`;
                router.push(`/planification?date=${dateString}`);
              }}
            >
              Cargar Primer Score
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Scores Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scores.map((score: any) => {
            const data = score.data as any;
            const scoreType = data?.type;
            const completedAt = score.completed_at || score.completedAt;
            const planificationTitle =
              score.planification?.title || "Planificación";
            const durationSeconds =
              score.duration_seconds || score.durationSeconds;
            const weight = data?.weight;

            return (
              <div
                key={score.id}
                className="flex items-center justify-between p-4 bg-card rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{planificationTitle}</span>
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      {scoreType === "wod_score" ? "WOD" : "Fuerza"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {completedAt
                      ? formatDistanceToNow(new Date(completedAt), {
                          addSuffix: true,
                          locale: es,
                        })
                      : "Fecha no disponible"}
                  </div>
                </div>
                <div className="text-right ml-4">
                  {scoreType === "wod_score" && durationSeconds ? (
                    <>
                      <div className="font-bold text-lime-400">
                        {formatDuration(durationSeconds)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tiempo
                      </div>
                    </>
                  ) : scoreType === "strength_score" && weight ? (
                    <>
                      <div className="font-bold text-blue-400">{weight} kg</div>
                      <div className="text-xs text-muted-foreground">Peso</div>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
