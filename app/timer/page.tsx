"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { TimerModeSelector } from "@/components/timer/timer-mode-selector";
import { TimerConfig } from "@/components/timer/timer-config";
import { TimerDisplay } from "@/components/timer/timer-display";
import { TimerInfo } from "@/components/timer/timer-info";
import { useTimer, TimerMode } from "@/hooks/use-timer";

export default function TimerPage() {
  const router = useRouter();
  const [mode, setMode] = useState<TimerMode>("normal");
  const [workTime, setWorkTime] = useState("20");
  const [restTime, setRestTime] = useState("10");
  const [totalRounds, setTotalRounds] = useState("8");
  const [amrapTime, setAmrapTime] = useState("10");

  const {
    time,
    isRunning,
    isPaused,
    currentRound,
    isWorkPhase,
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
