"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Volume2,
  VolumeX,
  Clock,
  Timer,
  Zap,
  Target,
  Repeat,
  Bell,
} from "lucide-react";
import { TimerMode } from "@/hooks/use-timer";

interface TimerDisplayProps {
  mode: TimerMode;
  currentRound?: number;
  totalRounds?: string;
  displayTime: string;
  phaseText: string;
  phaseColor: string;
  isRunning: boolean;
  isPaused: boolean;
  countdown?: number | null;
  emomTotalTime?: string;
  soundEnabled?: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onToggleFullscreen?: () => void;
  onToggleSound?: () => void;
}

const modeIcons = {
  normal: Clock,
  tabata: Zap,
  fortime: Timer,
  amrap: Target,
  emom: Bell,
  otm: Repeat,
};

const modeNames = {
  normal: "Cronómetro Normal",
  tabata: "TABATA",
  fortime: "FOR TIME",
  amrap: "AMRAP",
  emom: "EMOM",
  otm: "OTM",
};

export function TimerDisplay({
  mode,
  currentRound,
  totalRounds,
  displayTime,
  phaseText,
  phaseColor,
  isRunning,
  isPaused,
  countdown,
  emomTotalTime,
  soundEnabled = true,
  onStart,
  onPause,
  onReset,
  onToggleFullscreen,
  onToggleSound,
}: TimerDisplayProps) {
  const Icon = modeIcons[mode];
  const isCountdownActive =
    (mode === "normal" ||
      mode === "tabata" ||
      mode === "fortime" ||
      mode === "amrap" ||
      mode === "emom" ||
      mode === "otm") &&
    countdown !== null &&
    countdown !== undefined &&
    countdown > 0;

  return (
    <Card className="max-w-md mx-auto relative">
      <CardHeader className="text-center">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <CardTitle className="flex items-center justify-center gap-2 flex-1">
            <Icon className="w-6 h-6 text-primary" />
            {modeNames[mode]}
          </CardTitle>
          <div className="flex-1 flex justify-end gap-1">
            {onToggleSound && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSound}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title={soundEnabled ? "Silenciar" : "Activar sonido"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
            )}
            {onToggleFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFullscreen}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        {/* Mostrar rondas para TABATA y EMOM */}
        {(mode === "tabata" || mode === "emom") &&
          currentRound &&
          totalRounds &&
          !isCountdownActive && (
            <div className="text-xl font-bold text-primary">
              Ronda {currentRound} de {totalRounds}
            </div>
          )}

        {(mode === "tabata" ||
          mode === "normal" ||
          mode === "fortime" ||
          mode === "amrap" ||
          mode === "emom" ||
          mode === "otm" ||
          phaseText === "PREPARATE") && (
          <div
            className={`text-xl font-bold ${
              phaseText === "PREPARATE"
                ? "text-orange-500 animate-pulse"
                : phaseColor
            }`}
          >
            {phaseText}
          </div>
        )}

        <div
          className={`text-6xl font-mono font-bold ${
            phaseText === "PREPARATE" ? "text-orange-500" : phaseColor
          }`}
        >
          {displayTime}
        </div>

        {/* Tiempo total para EMOM */}
        {mode === "emom" && emomTotalTime && !isCountdownActive && (
          <div className="text-lg text-muted-foreground">
            Tiempo total: <span className="font-mono font-bold text-foreground text-2xl">{emomTotalTime}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {!isRunning ? (
            <Button
              onClick={onStart}
              size="lg"
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto h-14 sm:h-11 text-base sm:text-sm px-8 sm:px-6"
            >
              <Play className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
              Iniciar
            </Button>
          ) : (
            <Button
              onClick={onPause}
              size="lg"
              variant="outline"
              disabled={isCountdownActive}
              className="w-full sm:w-auto h-14 sm:h-11 text-base sm:text-sm px-8 sm:px-6"
            >
              {isPaused ? (
                <>
                  <Play className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
                  Continuar
                </>
              ) : (
                <>
                  <Pause className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
                  Pausar
                </>
              )}
            </Button>
          )}

          <Button
            onClick={onReset}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto h-14 sm:h-11 text-base sm:text-sm px-8 sm:px-6"
          >
            <RotateCcw className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
