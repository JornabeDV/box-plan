"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Timer, Play, Pause, RotateCcw, ChevronDown, Maximize2, Volume2, VolumeX } from "lucide-react";
import type { Planification, TimerMode } from "./types";
import { useState, useRef, useEffect, useCallback } from "react";
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
import { useTimer, TimerMode as TimerModeType } from "@/hooks/use-timer";
import { cn } from "@/lib/utils";

interface PlanificationBlocksProps {
  blocks: Planification["blocks"];
  disciplineColor?: string;
}

function BlockTimerDisplay({
  timerMode,
  timerConfig,
  color,
}: {
  timerMode: TimerMode;
  timerConfig?: {
    workTime?: string;
    restTime?: string;
    totalRounds?: string;
    amrapTime?: string;
  };
  color?: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<HTMLDivElement>(null);
  const timerColor = color || "#22c55e";
  const modeLabels: Record<TimerMode, string> = {
    normal: "Cronómetro",
    tabata: "TABATA",
    fortime: "FOR TIME",
    amrap: "AMRAP",
    emom: "EMOM",
    otm: "OTM",
  };

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

  const getDefaultValues = (mode: TimerMode) => {
    switch (mode) {
      case "amrap":
        return { workTime: "20", restTime: "60", totalRounds: "1", amrapTime: "10" };
      case "tabata":
        return { workTime: "20", restTime: "10", totalRounds: "8", amrapTime: "10" };
      case "emom":
        return { workTime: "20", restTime: "10", totalRounds: "10", amrapTime: "10" };
      case "otm":
        return { workTime: "2", restTime: "0", totalRounds: "5", amrapTime: "10" };
      default:
        return { workTime: "20", restTime: "10", totalRounds: "8", amrapTime: "10" };
    }
  };

  const defaults = getDefaultValues(timerMode);
  const [mode, setMode] = useState<TimerModeType>(timerMode as TimerModeType);
  const [workTime, setWorkTime] = useState(timerConfig?.workTime || defaults.workTime);
  const [restTime, setRestTime] = useState(timerConfig?.restTime || defaults.restTime);
  const [totalRounds, setTotalRounds] = useState(timerConfig?.totalRounds || defaults.totalRounds);
  const [amrapTime, setAmrapTime] = useState(timerConfig?.amrapTime || defaults.amrapTime);

  const {
    isRunning,
    isPaused,
    currentRound,
    countdown,
    getDisplayTime,
    getPhaseText,
    getPhaseColor,
    getEmomTotalTime,
    getOtmTotalTime,
    soundEnabled: timerSoundEnabled,
    toggleSound,
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

  const effectiveSoundEnabled = timerSoundEnabled && soundEnabled;

  const handleModeChange = (newMode: TimerModeType) => {
    setMode(newMode);
    handleReset(true);
    const newDefaults = getDefaultValues(newMode as TimerMode);
    setWorkTime(newDefaults.workTime);
    setRestTime(newDefaults.restTime);
    setTotalRounds(newDefaults.totalRounds);
    setAmrapTime(newDefaults.amrapTime);
  };

  const displayTime = getDisplayTime();
  const phaseText = getPhaseText();
  const phaseColor = getPhaseColor();

  const toggleTimer = () => setIsCollapsed(!isCollapsed);

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
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white/80 hover:text-white hover:bg-white/10 h-10 w-10"
            >
              {effectiveSoundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white/80 hover:text-white hover:bg-white/10 h-10 w-10"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {(mode === "tabata" ||
            mode === "emom" ||
            mode === "otm" ||
            (mode === "amrap" && parseInt(totalRounds) > 1)) &&
            !countdown && (
              <div className="text-2xl md:text-4xl font-bold text-lime-400 mb-4">
                Ronda {currentRound} de {totalRounds}
              </div>
            )}
          {(mode === "tabata" || mode === "amrap") && !countdown && (
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
          {(mode === "emom" || mode === "otm") && !countdown && (
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
                disabled={!!countdown}
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

  return (
    <div ref={timerRef} className="w-full">
    <Card className="border-lime-400/30 overflow-hidden py-0 md:py-0 gap-0 md:gap-0">
      {/* Header - siempre visible */}
      <div 
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={toggleTimer}
      >
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-lime-400" />
          <span className="text-sm font-semibold text-white">
            Timer
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
            }}
            className="h-8 w-8 p-0"
          >
            {effectiveSoundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="h-8 w-8 p-0"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <ChevronDown 
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-300",
              !isCollapsed && "rotate-180"
            )} 
          />
        </div>
      </div>

      {/* Contenido expandible */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
        )}
      >
        <CardContent className="space-y-3 pb-4">
          <div className="flex items-center gap-2">
            <Select value={mode} onValueChange={(v) => handleModeChange(v as TimerModeType)}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Cronómetro</SelectItem>
                <SelectItem value="fortime">FOR TIME</SelectItem>
                <SelectItem value="amrap">AMRAP</SelectItem>
                <SelectItem value="emom">EMOM</SelectItem>
                <SelectItem value="otm">OTM</SelectItem>
                <SelectItem value="tabata">TABATA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(mode === "tabata" || mode === "emom" || mode === "otm") && (
            <div className="grid grid-cols-3 gap-2">
              {mode === "tabata" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Trabajo</Label>
                    <Input
                      type="number"
                      value={workTime}
                      onChange={(e) => setWorkTime(e.target.value)}
                      disabled={isRunning}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descanso</Label>
                    <Input
                      type="number"
                      value={restTime}
                      onChange={(e) => setRestTime(e.target.value)}
                      disabled={isRunning}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Rondas</Label>
                    <Input
                      type="number"
                      value={totalRounds}
                      onChange={(e) => setTotalRounds(e.target.value)}
                      disabled={isRunning}
                      className="h-8"
                    />
                  </div>
                </>
              )}
              {(mode === "emom" || mode === "otm") && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Rondas</Label>
                  <Input
                    type="number"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(e.target.value)}
                    disabled={isRunning}
                    className="h-8"
                  />
                </div>
              )}
            </div>
          )}

          {mode === "amrap" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tiempo (min)</Label>
                <Input
                  type="number"
                  value={amrapTime}
                  onChange={(e) => setAmrapTime(e.target.value)}
                  disabled={isRunning}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Rondas</Label>
                <Input
                  type="number"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(e.target.value)}
                  disabled={isRunning}
                  className="h-8"
                />
              </div>
            </div>
          )}

          <div className="text-center py-2 bg-zinc-900/50 rounded-lg">
            {(mode === "tabata" ||
              mode === "emom" ||
              mode === "otm" ||
              (mode === "amrap" && parseInt(totalRounds) > 1)) &&
              !countdown && (
                <div className="text-sm font-medium text-lime-400 mb-1">
                  Ronda {currentRound} de {totalRounds}
                </div>
              )}
            {(mode === "tabata" || mode === "amrap") && !countdown && (
              <div className={cn("text-sm font-medium mb-1", phaseColor)}>
                {phaseText}
              </div>
            )}
            <div className="text-3xl font-mono font-bold text-white">{displayTime}</div>
            {(mode === "emom" || mode === "otm") && !countdown && (
              <div className="text-sm text-white/70 mt-1">
                Total: {mode === "emom" ? getEmomTotalTime() : getOtmTotalTime()}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                className="flex-1 bg-lime-400 hover:bg-lime-500 text-black h-9"
              >
                <Play className="w-4 h-4 mr-1" />
                Iniciar
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                variant="outline"
                className="flex-1 h-9"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pausar
              </Button>
            )}
            <Button onClick={() => handleReset()} variant="outline" className="h-9">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
        </div>
      </Card>
    </div>
  );
}

export function PlanificationBlocks({
  blocks,
  disciplineColor,
}: PlanificationBlocksProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  if (sortedBlocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
        <FileText className="w-6 h-6 text-lime-400" />
        Bloques de Entrenamiento
      </h3>
      {sortedBlocks.map((block, index) => (
        <Card key={block.id || index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg text-white">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md"
                  style={{
                    backgroundColor: disciplineColor || "hsl(var(--primary))",
                  }}
                >
                  {index + 1}
                </span>
                {block.title}
              </CardTitle>
              {block.timer_mode && (
                <BlockTimerDisplay
                  timerMode={block.timer_mode}
                  timerConfig={block.timer_config}
                  color={disciplineColor}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {block.items && block.items.length > 0 && (
              <ul className="space-y-3 mb-4">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <CheckCircle
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{
                        color: disciplineColor || "hsl(var(--primary))",
                      }}
                    />
                    <span className="text-base text-zinc-100">{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {block.subBlocks && block.subBlocks.length > 0 && (
              <div className="space-y-4">
                {block.subBlocks.map((subBlock) => (
                  <div key={subBlock.id}>
                    <div className="flex flex-col items-start justify-between gap-2 mb-2 ml-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1 h-4 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              disciplineColor || "hsl(var(--primary))",
                          }}
                        />
                        <h4 className="text-sm font-semibold text-zinc-300">
                          {subBlock.subtitle}
                        </h4>
                      </div>
                      {subBlock.timer_mode && (
                        <BlockTimerDisplay
                          timerMode={subBlock.timer_mode}
                          timerConfig={subBlock.timer_config}
                          color={disciplineColor}
                        />
                      )}
                    </div>
                    {subBlock.items.length > 0 ? (
                      <ul className="space-y-2 pl-3">
                        {subBlock.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle
                              className="w-4 h-4 mt-0.5 flex-shrink-0"
                              style={{
                                color: disciplineColor || "hsl(var(--primary))",
                              }}
                            />
                            <span className="text-sm text-zinc-100">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-zinc-400 pl-3">Sin ejercicios</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(!block.items || block.items.length === 0) &&
              (!block.subBlocks || block.subBlocks.length === 0) && (
                <p className="text-sm text-zinc-400 mb-4">
                  Sin ejercicios específicos
                </p>
              )}

            {block.notes && (
              <div className="mt-4 pt-4 border-t border-zinc-800/50">
                <p className="text-xs font-medium text-zinc-400 mb-2">
                  Notas del bloque:
                </p>
                <p className="text-sm text-zinc-200 bg-zinc-950/60 p-3 rounded-md whitespace-pre-wrap border border-zinc-800/40">
                  {block.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}