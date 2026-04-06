"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Timer, Play, Pause, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import type { Planification, TimerMode } from "./types";
import { useState } from "react";
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
  const timerColor = color || "#22c55e";
  const modeLabels: Record<TimerMode, string> = {
    normal: "Cronómetro",
    tabata: "TABATA",
    fortime: "FOR TIME",
    amrap: "AMRAP",
    emom: "EMOM",
    otm: "OTM",
  };

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
    time,
    isRunning,
    isPaused,
    currentRound,
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

  if (isCollapsed) {
    return (
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors border-lime-400/30 w-full py-2 md:py-3"
        onClick={() => setIsCollapsed(false)}
      >
        <CardContent className="px-2 md:px-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-lime-400/10 flex items-center justify-center flex-shrink-0">
                <Timer className="w-5 h-5 text-lime-400" />
              </div>
              <div className="min-w-0">
                {/* <h3 className="font-semibold text-white text-lg">
                  Timer de Bloque
                </h3> */}
                <p className="text-sm text-muted-foreground">
                  Modo: {modeLabels[timerMode]}
                </p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-lime-400/30 w-full">
      <CardHeader>
        <div className="flex items-center justify-between pr-2">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-lime-400" />
            <span className="text-sm font-semibold text-white">
              {modeLabels[timerMode]}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
    </Card>
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
                    <div className="flex flex-col items-start justify-between gap-2 mb-2 w-full">
                      <div className="flex items-center gap-2 ml-2">
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