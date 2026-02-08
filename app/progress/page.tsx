"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { useWorkouts } from "@/hooks/use-workouts";
import { useRMs } from "@/hooks/use-rms";
import { useProgressStats } from "@/hooks/use-progress-stats";
import { ProgressHeader } from "@/components/progress/progress-header";
import { ProgressStatsCards } from "@/components/progress/progress-stats-cards";
import { RecentScores } from "@/components/progress/recent-scores";
import { RMList } from "@/components/progress/rm-list";
import { Loader2, Lock } from "lucide-react";

export default function ProgresoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    canTrackProgress,
    loading: subscriptionLoading,
  } = useStudentSubscription();
  const { workouts, loading: workoutsLoading } = useWorkouts();
  const { rmRecords, loading: rmsLoading } = useRMs();
  const { stats, loading: loadingStats } = useProgressStats(
    user?.id ? String(user.id) : undefined
  );

  if (authLoading || subscriptionLoading || workoutsLoading) {
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

  // Verificar si tiene acceso a la funcionalidad de progreso
  if (!canTrackProgress) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="p-6 pb-32 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Funcionalidad no disponible
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                La página de Progreso no está incluida en tu plan actual.
              </p>
              <p className="text-sm text-muted-foreground">
                Para acceder a esta funcionalidad, necesitas un plan que incluya
                el seguimiento de progreso.
              </p>
              <Button
                onClick={() => router.push("/subscription")}
                className="w-full"
              >
                Ver Planes Disponibles
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="p-6 space-y-6 pb-32 max-w-6xl mx-auto">
        <ProgressHeader />

        <ProgressStatsCards
          stats={stats}
          rmCount={rmRecords?.length || 0}
          loading={loadingStats || rmsLoading}
        />

        <RecentScores workouts={workouts || []} />

        <RMList rmRecords={rmRecords || []} />
      </main>

      <BottomNavigation />
    </div>
  );
}
