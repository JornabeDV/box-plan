"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  CheckCircle,
  Timer,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  Maximize2,
  Volume2,
  VolumeX,
} from "lucide-react";
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

  const defaults = getDefaultValues(timerMode);
  const [mode, setMode] = useState<TimerModeType>(timerMode as TimerModeType);
  const [workTime, setWorkTime] = useState(
    timerConfig?.workTime || defaults.workTime,
  );
  const [restTime, setRestTime] = useState(
    timerConfig?.restTime || defaults.restTime,
  );
  const [totalRounds, setTotalRounds] = useState(
    timerConfig?.totalRounds || defaults.totalRounds,
  );
  const [amrapTime, setAmrapTime] = useState(
    timerConfig?.amrapTime || defaults.amrapTime,
  );

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
              className="text-foreground hover:text-white hover:bg-white/10 h-10 w-10"
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
              <div className="text-2xl md:text-4xl font-bold text-primary mb-4">
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
                className="flex-1 bg-primary hover:bg-primary-container text-black h-14 text-lg"
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
      <div className="bg-surface-container-high border-primary border-l-2 overflow-hidden">
        {/* Header - siempre visible */}
        <div
          className="flex items-center justify-between px-2 md:px-4 py-3 cursor-pointer hover:bg-surface-container transition-colors"
          onClick={toggleTimer}
        >
          <div className="flex items-center gap-3 ">
            <div className="w-8 h-8 flex items-center justify-center text-primary">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-primary leading-none">
                {modeLabels[timerMode]}
              </p>
              <p className="text-xs font-bold text-foreground mt-0.5">TIMER</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setSoundEnabled(!soundEnabled);
              }}
              className="h-8 w-8 p-0 text-foreground hover:text-foreground"
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
              className="h-8 w-8 p-0 text-foreground hover:text-foreground"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <ChevronDown
              className={cn(
                "w-11 h-6 text-foreground transition-transform duration-300",
                !isCollapsed && "rotate-180",
              )}
            />
          </div>
        </div>

        {/* Contenido expandible */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100",
          )}
        >
          <CardContent className="space-y-3 pb-4">
            <div className="flex items-center gap-2">
              <Select
                value={mode}
                onValueChange={(v) => handleModeChange(v as TimerModeType)}
              >
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
                      <Label className="text-xs text-muted-foreground">
                        Trabajo
                      </Label>
                      <Input
                        type="number"
                        value={workTime}
                        onChange={(e) => setWorkTime(e.target.value)}
                        disabled={isRunning}
                        className="h-8"
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
                        disabled={isRunning}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Rondas
                      </Label>
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
                    <Label className="text-xs text-muted-foreground">
                      Rondas
                    </Label>
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
                  <Label className="text-xs text-muted-foreground">
                    Tiempo (min)
                  </Label>
                  <Input
                    type="number"
                    value={amrapTime}
                    onChange={(e) => setAmrapTime(e.target.value)}
                    disabled={isRunning}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Rondas
                  </Label>
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

            <div className="text-center py-2 bg-surface-container">
              {(mode === "tabata" ||
                mode === "emom" ||
                mode === "otm" ||
                (mode === "amrap" && parseInt(totalRounds) > 1)) &&
                !countdown && (
                  <div className="text-sm font-medium text-primary mb-1">
                    Ronda {currentRound} de {totalRounds}
                  </div>
                )}
              {(mode === "tabata" || mode === "amrap") && !countdown && (
                <div className={cn("text-sm font-medium mb-1", phaseColor)}>
                  {phaseText}
                </div>
              )}
              <div className="text-3xl font-mono font-bold text-foreground">
                {displayTime}
              </div>
              {(mode === "emom" || mode === "otm") && !countdown && (
                <div className="text-sm text-muted-foreground mt-1">
                  Total:{" "}
                  {mode === "emom" ? getEmomTotalTime() : getOtmTotalTime()}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  className="flex-1 bg-primary hover:bg-primary-container text-black h-9"
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
              <Button
                onClick={() => handleReset()}
                variant="outline"
                className="h-9"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold tracking-[0.03em] uppercase text-foreground">
          Bloques de Entrenamiento
        </h2>
      </div>
      {sortedBlocks.map((block, index) => (
        <Card key={block.id || index} className="bg-surface-container">
          <CardHeader>
            <div className="flex flex-col items-center justify-between gap-4">
              <div className="flex items-baseline gap-3 w-full">
                <span className="text-3xl font-bold text-primary leading-none">
                  {index + 1}
                </span>
                <div>
                  <span className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase text-primary bg-primary/10 px-2 py-0.5 rounded mb-1">
                    Bloque
                  </span>
                  <CardTitle className="text-xl md:text-2xl uppercase italic text-foreground leading-tight">
                    {block.title}
                  </CardTitle>
                </div>
              </div>
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
                  <li key={itemIndex} className="flex items-center gap-3">
                    <CheckCircle
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{
                        color: disciplineColor || "hsl(var(--primary))",
                      }}
                    />
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm text-foreground">
                        {typeof item === "string" ? item : item.description}
                      </span>
                      {typeof item !== "string" && item.exercise?.video_url && (
                        <a
                          href={item.exercise.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors flex-shrink-0 min-h-5"
                        >
                          <span className="hidden sm:inline">Ver cómo se hace</span>
                          <span className="sm:hidden">Video</span>
                          <Play className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {block.subBlocks && block.subBlocks.length > 0 && (
              <div className="space-y-4">
                {block.subBlocks.map((subBlock) => (
                  <div
                    key={subBlock.id}
                    className="bg-surface-container border-l-0 border-primary"
                  >
                    {subBlock.subtitle && (
                      <div className="mb-2">
                        <span className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase text-primary bg-primary/10 px-2 py-0.5 rounded mb-1">
                          Sub-bloque
                        </span>
                        <h4 className="text-base font-bold uppercase tracking-wide text-foreground">
                          {subBlock.subtitle}
                        </h4>
                      </div>
                    )}
                    <div className="flex flex-col items-start justify-between gap-2 mb-3">
                      {subBlock.timer_mode && (
                        <BlockTimerDisplay
                          timerMode={subBlock.timer_mode}
                          timerConfig={subBlock.timer_config}
                          color={disciplineColor}
                        />
                      )}
                    </div>
                    {subBlock.items.length > 0 ? (
                      <ul className="space-y-2">
                        {subBlock.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle
                              className="w-4 h-4 mt-0.5 flex-shrink-0"
                              style={{
                                color: disciplineColor || "hsl(var(--primary))",
                              }}
                            />
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm text-foreground">
                                {typeof item === "string"
                                  ? item
                                  : item.description}
                              </span>
                              {typeof item !== "string" &&
                                item.exercise?.video_url && (
                                  <a
                                    href={item.exercise.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 ml-2 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors flex-shrink-0 min-h-5"
                                  >
                                    <Play className="w-3 h-3" />
                                    <span className="hidden sm:inline">
                                      Ver cómo se hace
                                    </span>
                                    <span className="sm:hidden">Video</span>
                                  </a>
                                )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Sin ejercicios
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(!block.items || block.items.length === 0) &&
              (!block.subBlocks || block.subBlocks.length === 0) && (
                <p className="text-sm text-muted-foreground mb-4">
                  Sin ejercicios específicos
                </p>
              )}

            {block.notes && (
              <div className="mt-4 pt-4 border-t border-outline/10">
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
                  Notas del bloque
                </p>
                <p className="text-sm text-foreground bg-surface-container-low p-3 whitespace-pre-wrap border border-outline/10">
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
