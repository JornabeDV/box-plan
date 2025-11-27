"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { useWorkouts } from "@/hooks/use-workouts";
import { useRMs } from "@/hooks/use-rms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Calendar,
  Target,
  ArrowLeft,
  Loader2,
  Weight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function ProgresoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { workouts, loading: workoutsLoading, getUserStats } = useWorkouts();
  const { rmRecords, loading: rmsLoading } = useRMs();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (user?.id && getUserStats) {
        setLoadingStats(true);
        try {
          const statsData = await getUserStats();
          setStats(statsData);
        } catch (error) {
          console.error("Error loading stats:", error);
          setStats(null);
        } finally {
          setLoadingStats(false);
        }
      }
    };
    loadStats();
  }, [user?.id, getUserStats]);

  if (authLoading || workoutsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">No autorizado</h2>
          <Button onClick={() => router.push("/login")}>Iniciar Sesión</Button>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="p-6 space-y-6 pb-32 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 md:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 md:order-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2 md:order-1">
              <BarChart3 className="w-8 h-8 text-lime-400" />
              Mi Progreso
            </h1>
          </div>
        </div>

        {/* Estadísticas Generales */}
        {loadingStats || rmsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-lime-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">
                      Cargando...
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
            <Card className="py-2">
              <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-lime-400 mb-1">
                    {stats?.totalScores || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Scores
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="py-2">
              <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {stats?.thisWeek || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Esta Semana
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="py-2">
              <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {stats?.thisMonth || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Este Mes</div>
                </div>
              </CardContent>
            </Card>

            <Card className="py-2">
              <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-1">
                    {stats?.streak || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Racha (días)
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de RMs */}
            <Card
              className="cursor-pointer hover:bg-gray-900/10 dark:hover:bg-gray-100/5 transition-colors py-2"
              onClick={() => router.push("/log-rm")}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push("/log-rm");
                }
              }}
              role="button"
              aria-label="Ver repeticiones máximas"
            >
              <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-lime-400 mb-1">
                    {rmRecords?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Mis RMs</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scores Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Scores Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filtrar solo scores (wod_score y strength_score) y ordenar por fecha
              const scores = (workouts || [])
                .filter((w: any) => {
                  if (!w.data) return false;
                  const data = w.data as any;
                  return (
                    data.type === "wod_score" || data.type === "strength_score"
                  );
                })
                .slice(0, 5);

              if (scores.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay scores registrados aún</p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const year = today.getFullYear();
                        const month = String(today.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(today.getDate()).padStart(2, "0");
                        const dateString = `${year}-${month}-${day}`;
                        router.push(`/planification?date=${dateString}`);
                      }}
                    >
                      Cargar Primer Score
                    </Button>
                  </div>
                );
              }

              return (
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
                            <span className="font-semibold">
                              {planificationTitle}
                            </span>
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
                              <div className="font-bold text-blue-400">
                                {weight} kg
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Peso
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Mis RMs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Weight className="w-5 h-5" />
                Mis Repeticiones Máximas
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/log-rm")}
                className="flex items-center gap-2"
              >
                <Weight className="w-4 h-4" />
                Agregar RM
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!rmRecords || rmRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Weight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay RMs registrados aún</p>
                <Button className="mt-4" onClick={() => router.push("/log-rm")}>
                  Registrar Primer RM
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
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
                  const exercises = Array.from(exercisesMap.entries()).sort(
                    (a, b) => a[0].localeCompare(b[0])
                  );

                  return exercises.map(([exercise, records]) => {
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
                          <div className="font-semibold text-lg">
                            {exercise}
                          </div>
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
                              {records.length > 2 &&
                                ` (${records.length} registros)`}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-lime-400">
                            {weight} kg
                          </div>
                          <div className="text-xs text-muted-foreground">
                            RM Actual
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
