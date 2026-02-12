"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTimer, TimerMode } from "@/hooks/use-timer";
import { cn } from "@/lib/utils";

interface PlanificationTimerProps {
  planificationTitle?: string;
  blocksText?: string;
}

const modeLabels: Record<TimerMode, string> = {
  normal: "Cronómetro",
  fortime: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
  otm: "OTM",
  tabata: "Tabata",
};

const getDefaultValues = (mode: TimerMode) => {
  switch (mode) {
    case "amrap":
      return {
        workTime: "20",
        restTime: "60",
        totalRounds: "1",
        amrapTime: "10",
      };
    case "tabata":
      return {
        workTime: "20",
        restTime: "10",
        totalRounds: "8",
        amrapTime: "10",
      };
    case "emom":
      return {
        workTime: "20",
        restTime: "10",
        totalRounds: "10",
        amrapTime: "10",
      };
    case "otm":
      return {
        workTime: "2",
        restTime: "0",
        totalRounds: "5",
        amrapTime: "10",
      };
    default:
      return {
        workTime: "20",
        restTime: "10",
        totalRounds: "8",
        amrapTime: "10",
      };
  }
};

export function PlanificationTimer({
  planificationTitle = "",
  blocksText = "",
}: PlanificationTimerProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<HTMLDivElement>(null);

  const detectMode = (): TimerMode => {
    const fullText = (planificationTitle + " " + blocksText).toLowerCase();
    if (fullText.includes("amrap")) return "amrap";
    if (fullText.includes("emom")) return "emom";
    if (fullText.includes("otm")) return "otm";
    if (fullText.includes("tabata")) return "tabata";
    if (fullText.includes("for time") || fullText.includes("fortime"))
      return "fortime";
    return "normal";
  };

  const initialMode = detectMode();
  const defaults = getDefaultValues(initialMode);

  const [mode, setMode] = useState<TimerMode>(initialMode);
  const [workTime, setWorkTime] = useState(defaults.workTime);
  const [restTime, setRestTime] = useState(defaults.restTime);
  const [totalRounds, setTotalRounds] = useState(defaults.totalRounds);
  const [amrapTime, setAmrapTime] = useState(defaults.amrapTime);

  const {
    time,
    isRunning,
    isPaused,
    currentRound,
    countdown,
    soundEnabled,
    getDisplayTime,
    getPhaseText,
    getPhaseColor,
    getEmomTotalTime,
    getOtmTotalTime,
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

  const enterFullscreen = useCallback(async () => {
    try {
      const element = timerRef.current;
      if (!element) return;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      }
    } catch (err) {
      console.error("Error entering fullscreen:", err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    } catch (err) {
      console.error("Error exiting fullscreen:", err);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, []);

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    handleReset(true);
    const newDefaults = getDefaultValues(newMode);
    setWorkTime(newDefaults.workTime);
    setRestTime(newDefaults.restTime);
    setTotalRounds(newDefaults.totalRounds);
    setAmrapTime(newDefaults.amrapTime);
  };

  const displayTime = getDisplayTime();
  const phaseText = getPhaseText();
  const phaseColor = getPhaseColor();
  const isCountdownActive = countdown !== null && countdown > 0;

  // Vista fullscreen
  if (isFullscreen) {
    return (
      <div
        ref={timerRef}
        className="fixed inset-0 bg-gray-950 z-[100] flex flex-col"
      >
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
          <div className="text-white/60 text-lg font-medium">
            {modeLabels[mode]}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {(mode === "tabata" ||
            mode === "emom" ||
            mode === "otm" ||
            (mode === "amrap" && parseInt(totalRounds) > 1)) &&
            !isCountdownActive && (
              <div className="text-2xl md:text-4xl font-bold text-lime-400 mb-4">
                Ronda {currentRound} de {totalRounds}
              </div>
            )}
          {(mode === "tabata" || mode === "amrap") && !isCountdownActive && (
            <div
              className={cn("text-2xl md:text-4xl font-bold mb-4", phaseColor)}
            >
              {phaseText}
            </div>
          )}
          <div
            className={cn(
              "text-7xl md:text-[10rem] font-mono font-bold text-center",
              phaseText === "PREPARATE"
                ? "text-orange-500 animate-pulse"
                : "text-white",
            )}
          >
            {displayTime}
          </div>
          {(mode === "emom" || mode === "otm") && !isCountdownActive && (
            <div className="text-xl md:text-3xl text-white/70 mt-4">
              Total: {mode === "emom" ? getEmomTotalTime() : getOtmTotalTime()}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 pb-10">
          <div className="flex justify-center gap-4 max-w-md mx-auto">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                className="flex-1 bg-lime-400 hover:bg-lime-500 text-black h-14 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                variant="outline"
                disabled={isCountdownActive}
                className="flex-1 h-14 text-lg border-white/30 text-white hover:bg-white/10"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Continuar
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pausar
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={() => handleReset()}
              variant="outline"
              className="flex-1 h-14 text-lg border-white/30 text-white hover:bg-white/10"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Vista colapsada
  if (isCollapsed) {
    return (
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsCollapsed(false)}
      >
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-lime-400/10 flex items-center justify-center flex-shrink-0">
                <Timer className="w-5 h-5 text-lime-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-white max-sm:text-lg">
                  Timer de Entrenamiento
                </h3>
                <p className="text-sm text-muted-foreground">
                  Modo: {modeLabels[mode]}
                </p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vista expandida
  return (
    <div ref={timerRef}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="w-5 h-5 text-lime-400" />
              Timer
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSound}
                className="h-8 w-8"
                title={soundEnabled ? "Silenciar" : "Activar sonido"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8"
                title="Pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="h-8 w-8"
                title="Colapsar"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Modo</Label>
            <Select
              value={mode}
              onValueChange={(v) => handleModeChange(v as TimerMode)}
              disabled={isRunning}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Cronómetro Normal</SelectItem>
                <SelectItem value="fortime">For Time</SelectItem>
                <SelectItem value="amrap">AMRAP</SelectItem>
                <SelectItem value="emom">EMOM</SelectItem>
                <SelectItem value="otm">OTM</SelectItem>
                <SelectItem value="tabata">Tabata</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "tabata" && (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Trabajo</Label>
                <Input
                  type="number"
                  value={workTime}
                  onChange={(e) => setWorkTime(e.target.value)}
                  min="1"
                  max="999"
                  disabled={isRunning}
                  className="h-11"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Descanso
                </Label>
                <Input
                  type="number"
                  value={restTime}
                  onChange={(e) => setRestTime(e.target.value)}
                  min="1"
                  max="999"
                  disabled={isRunning}
                  className="h-11"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Rondas</Label>
                <Input
                  type="number"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(e.target.value)}
                  min="1"
                  max="99"
                  disabled={isRunning}
                  className="h-11"
                />
              </div>
            </div>
          )}

          {mode === "amrap" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Tiempo (min)
                </Label>
                <Input
                  type="number"
                  value={amrapTime}
                  onChange={(e) => setAmrapTime(e.target.value)}
                  min="1"
                  max="999"
                  disabled={isRunning}
                  className="h-11"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Rondas</Label>
                <Input
                  type="number"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(e.target.value)}
                  min="1"
                  max="99"
                  disabled={isRunning}
                  className="h-11"
                />
              </div>
            </div>
          )}

          {(mode === "emom" || mode === "otm") && (
            <div
              className={cn(
                "grid gap-2",
                mode === "otm" ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Rondas</Label>
                <Input
                  type="number"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(e.target.value)}
                  min="1"
                  max="99"
                  disabled={isRunning}
                  className="h-11"
                />
              </div>
              {mode === "otm" && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Min/ronda
                  </Label>
                  <Input
                    type="number"
                    value={workTime}
                    onChange={(e) => setWorkTime(e.target.value)}
                    min="1"
                    max="60"
                    disabled={isRunning}
                    className="h-11"
                  />
                </div>
              )}
            </div>
          )}

          <div className="text-center py-5 bg-muted/30 rounded-lg">
            {(mode === "tabata" ||
              mode === "emom" ||
              mode === "otm" ||
              (mode === "amrap" && parseInt(totalRounds) > 1)) &&
              !isCountdownActive && (
                <div className="text-sm font-medium text-lime-400 mb-1">
                  Ronda {currentRound} de {totalRounds}
                </div>
              )}
            {(mode === "tabata" || mode === "amrap") && !isCountdownActive && (
              <div className={cn("text-sm font-medium mb-1", phaseColor)}>
                {phaseText}
              </div>
            )}
            <div
              className={cn(
                "text-5xl sm:text-6xl font-mono font-bold tracking-tight",
                phaseText === "PREPARATE"
                  ? "text-orange-500 animate-pulse"
                  : "text-white",
              )}
            >
              {displayTime}
            </div>
            {isCountdownActive && (
              <div className="text-sm text-orange-500 mt-1 animate-pulse font-medium">
                ¡Prepárate!
              </div>
            )}
            {(mode === "emom" || mode === "otm") && !isCountdownActive && (
              <div className="text-sm text-muted-foreground mt-1">
                Total:{" "}
                {mode === "emom" ? getEmomTotalTime() : getOtmTotalTime()}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                className="flex-1 bg-lime-400 hover:bg-lime-500 text-black h-12 sm:h-11 text-base"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                variant="outline"
                disabled={isCountdownActive}
                className="flex-1 h-12 sm:h-11 text-base"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Continuar
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pausar
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={() => handleReset()}
              variant="outline"
              className="flex-1 h-12 sm:h-11 text-base"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
