"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Lock,
  X,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from "lucide-react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerContainerRef = useRef<HTMLDivElement>(null);

  const {
    canUseTimer,
    isSubscribed,
    loading: subscriptionLoading,
  } = useStudentSubscription();

  const {
    time,
    isRunning,
    isPaused,
    currentRound,
    isWorkPhase,
    countdown,
    soundEnabled,
    getDisplayTime,
    getPhaseText,
    getPhaseColor,
    getEmomTotalTime,
    handleStart,
    handlePause,
    handleReset,
    toggleSound,
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

  // Función para entrar en pantalla completa
  const enterFullscreen = useCallback(async () => {
    try {
      const element = timerContainerRef.current;
      if (!element) return;

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.error("Error entering fullscreen:", err);
    }
  }, []);

  // Función para salir de pantalla completa
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error("Error exiting fullscreen:", err);
    }
  }, []);

  // Función alternar pantalla completa
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Escuchar cambios en el estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
              <h1 className="text-3xl font-heading md:order-1">
                Timer CrossFit
              </h1>
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
                Para acceder a esta funcionalidad, necesitas una suscripción
                activa que incluya el cronómetro profesional.
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

  // Si está en fullscreen, solo renderizar la vista fullscreen
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-gray-950 z-[100]">
        {/* Header con botones */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-10">
          <div className="text-white/60 text-base md:text-lg font-medium">
            {mode === "normal" && "Cronómetro"}
            {mode === "tabata" && "TABATA"}
            {mode === "fortime" && "FOR TIME"}
            {mode === "amrap" && "AMRAP"}
            {mode === "emom" && "EMOM"}
            {mode === "otm" && "OTM"}
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleSound}
              className="p-2 md:p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              type="button"
              title={soundEnabled ? "Silenciar" : "Activar sonido"}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <VolumeX className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>
            <button
              onClick={exitFullscreen}
              className="p-2 md:p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              type="button"
            >
              <Minimize2 className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Contenido principal centrado */}
        <div className="h-full flex flex-col items-center justify-center px-4">
          {/* Rondas (para Tabata y EMOM) */}
          {(mode === "tabata" || mode === "emom") &&
            currentRound &&
            totalRounds && (
              <div className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">
                Ronda {currentRound} de {totalRounds}
              </div>
            )}

          {/* Fase (para Tabata) */}
          {mode === "tabata" && (
            <div
              className={`text-3xl md:text-5xl font-bold mb-4 md:mb-6 ${isWorkPhase ? "text-lime-400" : "text-green-400"}`}
            >
              {isWorkPhase ? "TRABAJO" : "DESCANSO"}
            </div>
          )}

          {/* Temporizador principal - MUY GRANDE */}
          <div className="mb-4 md:mb-6">
            {/* Cuenta regresiva inicial */}
            {countdown !== null && countdown > 0 && (
              <div className="text-7xl md:text-9xl font-mono font-bold text-orange-500 animate-pulse text-center">
                {countdown}
              </div>
            )}

            {/* Tiempo principal */}
            {(!countdown || countdown <= 0) && (
              <div
                className={`text-7xl md:text-[10rem] lg:text-[14rem] font-mono font-bold text-center leading-none ${
                  mode === "tabata"
                    ? isWorkPhase
                      ? "text-lime-400"
                      : "text-green-400"
                    : "text-white"
                }`}
              >
                {getDisplayTime()}
              </div>
            )}
          </div>

          {/* Tiempo total para EMOM */}
          {mode === "emom" && (
            <div className="text-xl md:text-3xl text-white/70 mb-4">
              Total:{" "}
              <span className="font-mono font-bold text-white">
                {getEmomTotalTime()}
              </span>
            </div>
          )}

          {/* Tiempo restante para AMRAP */}
          {mode === "amrap" && (
            <div className="text-lg md:text-2xl text-white/60 mb-4">
              de {amrapTime} minutos
            </div>
          )}
        </div>

        {/* Controles abajo */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pb-8 md:pb-12">
          <div className="flex justify-center gap-3 md:gap-6">
            {!isRunning ? (
              <button
                onClick={handleStart}
                type="button"
                className="bg-lime-500 hover:bg-lime-600 active:bg-lime-700 text-black font-bold text-lg md:text-2xl h-14 md:h-20 px-8 md:px-16 rounded-full transition-colors cursor-pointer flex items-center justify-center"
              >
                <Play className="w-5 h-5 md:w-8 md:h-8 mr-2 md:mr-3" />
                Iniciar
              </button>
            ) : (
              <button
                onClick={handlePause}
                type="button"
                disabled={countdown !== null && countdown > 0}
                className="border-2 border-white/30 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-lg md:text-2xl h-14 md:h-20 px-8 md:px-16 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5 md:w-8 md:h-8 mr-2 md:mr-3" />
                    <span className="hidden md:inline">Continuar</span>
                    <span className="md:hidden">Play</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5 md:w-8 md:h-8 mr-2 md:mr-3" />
                    Pausar
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => handleReset()}
              type="button"
              className="border-2 border-white/30 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-lg md:text-2xl h-14 md:h-20 px-6 md:px-12 rounded-full transition-colors cursor-pointer flex items-center justify-center"
            >
              <RotateCcw className="w-5 h-5 md:w-8 md:h-8 mr-1 md:mr-3" />
              <span className="inline">Reset</span>
            </button>
          </div>

          {/* Botón para salir del modo fullscreen */}
          <div className="flex justify-center mt-4 md:mt-6">
            {" "}
            <button
              onClick={exitFullscreen}
              type="button"
              className="text-white/50 hover:text-white/80 text-sm transition-colors cursor-pointer flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Salir de pantalla completa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Vista Normal */}
      <div
        ref={timerContainerRef}
        className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground"
      >
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
              <h1 className="text-3xl font-heading md:order-1">
                Timer CrossFit
              </h1>
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
            emomTotalTime={getEmomTotalTime()}
            soundEnabled={soundEnabled}
            onStart={() => {
              handleStart();
              // Auto-entrar en pantalla completa al iniciar
              if (!isRunning && time === 0 && !countdown) {
                enterFullscreen();
              }
            }}
            onPause={handlePause}
            onReset={handleReset}
            onToggleFullscreen={toggleFullscreen}
            onToggleSound={toggleSound}
          />

          <TimerInfo mode={mode} />
        </main>

        <BottomNavigation />
      </div>
    </>
  );
}
