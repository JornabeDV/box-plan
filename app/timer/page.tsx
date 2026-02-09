"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { TimerModeSelector } from "@/components/timer/timer-mode-selector";
import { TimerConfig } from "@/components/timer/timer-config";
import { TimerDisplay } from "@/components/timer/timer-display";
import { TimerInfo } from "@/components/timer/timer-info";
import { useTimer, TimerMode } from "@/hooks/use-timer";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function TimerPage() {
  const router = useRouter();
  const [mode, setMode] = useState<TimerMode>("normal");
  const [workTime, setWorkTime] = useState("20");
  const [restTime, setRestTime] = useState("10");
  const [totalRounds, setTotalRounds] = useState("8");
  const [amrapTime, setAmrapTime] = useState("10");

  const { canUseTimer, isSubscribed, loading: subscriptionLoading } = useStudentSubscription();

  const {
    time,
    isRunning,
    isPaused,
    currentRound,
    isWorkPhase,
    countdown,
    getDisplayTime,
    getPhaseText,
    getPhaseColor,
    handleStart,
    handlePause,
    handleReset,
  } = useTimer({
    mode,
    workTime,
    restTime,
    totalRounds,
    amrapTime,
  });

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    handleReset(true);
    setWorkTime("20");
    setRestTime("10");
    setTotalRounds("8");
  };

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  // Si no tiene suscripción activa o no tiene acceso al timer
  if (!isSubscribed || !canUseTimer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
        <Header />

        <main className="p-6 pb-32 max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 md:justify-between max-w-md mx-auto mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center gap-2 md:order-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <h1 className="text-3xl font-heading md:order-1">Timer CrossFit</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Funcionalidad no disponible
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                El Timer profesional no está incluido en tu plan actual.
              </p>
              <p className="text-sm text-muted-foreground">
                Para acceder a esta funcionalidad, necesitas una suscripción activa 
                que incluya el cronómetro profesional.
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      <Header />

      <main className="p-6 space-y-6 pb-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 md:justify-between max-w-md mx-auto mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 md:order-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <h1 className="text-3xl font-heading md:order-1">Timer CrossFit</h1>
          </div>
        </div>

        <TimerModeSelector mode={mode} onModeChange={handleModeChange} />

        <TimerConfig
          mode={mode}
          workTime={workTime}
          restTime={restTime}
          totalRounds={totalRounds}
          amrapTime={amrapTime}
          isRunning={isRunning}
          isPaused={isPaused}
          onWorkTimeChange={setWorkTime}
          onRestTimeChange={setRestTime}
          onTotalRoundsChange={setTotalRounds}
          onAmrapTimeChange={setAmrapTime}
        />

        <TimerDisplay
          mode={mode}
          currentRound={currentRound}
          totalRounds={totalRounds}
          displayTime={getDisplayTime()}
          phaseText={getPhaseText()}
          phaseColor={getPhaseColor()}
          isRunning={isRunning}
          isPaused={isPaused}
          countdown={countdown}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
        />

        <TimerInfo mode={mode} />
      </main>

      <BottomNavigation />
    </div>
  );
}
