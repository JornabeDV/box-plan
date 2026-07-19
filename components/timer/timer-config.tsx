"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeInput } from "@/components/timer/time-input";
import { RoundsInput } from "@/components/timer/rounds-input";
import { TimerMode } from "@/hooks/use-timer";

interface TimerConfigProps {
  mode: TimerMode;
  workTime: string;
  restTime: string;
  totalRounds: string;
  amrapTime: string;
  forTimeCap: string;
  isRunning: boolean;
  isPaused: boolean;
  onWorkTimeChange: (value: string) => void;
  onRestTimeChange: (value: string) => void;
  onTotalRoundsChange: (value: string) => void;
  onAmrapTimeChange: (value: string) => void;
  onForTimeCapChange: (value: string) => void;
}

export function TimerConfig({
  mode,
  workTime,
  restTime,
  totalRounds,
  amrapTime,
  forTimeCap,
  isRunning,
  isPaused,
  onWorkTimeChange,
  onRestTimeChange,
  onTotalRoundsChange,
  onAmrapTimeChange,
  onForTimeCapChange,
}: TimerConfigProps) {
  if (mode === "tabata") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuración TABATA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <TimeInput
              id="workTime"
              label="Trabajo"
              value={workTime}
              onChange={onWorkTimeChange}
              max={999}
            />
            <TimeInput
              id="restTime"
              label="Descanso"
              value={restTime}
              onChange={onRestTimeChange}
              max={999}
            />
            <RoundsInput
              id="totalRounds"
              value={totalRounds}
              onChange={onTotalRoundsChange}
              min={1}
              max={99}
              placeholder="8"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === "amrap") {
    const totalRoundsNum = parseInt(totalRounds) || 1;

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuración AMRAP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TimeInput
              id="amrapTime"
              label="Tiempo total"
              value={amrapTime}
              onChange={onAmrapTimeChange}
              disabled={isRunning || isPaused}
              max={59940}
            />
            <RoundsInput
              id="totalRounds"
              value={totalRounds}
              onChange={onTotalRoundsChange}
              disabled={isRunning || isPaused}
              min={1}
              max={99}
              placeholder="1"
            />
          </div>
          {totalRoundsNum > 1 && (
            <TimeInput
              id="restTime"
              label="Descanso entre rondas"
              value={restTime}
              onChange={onRestTimeChange}
              disabled={isRunning || isPaused}
              max={999}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  if (mode === "emom") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuración EMOM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RoundsInput
            id="totalRounds"
            label="Número de Rondas"
            value={totalRounds}
            onChange={onTotalRoundsChange}
            disabled={isRunning || isPaused}
            min={1}
            max={99}
            placeholder="10"
          />
        </CardContent>
      </Card>
    );
  }

  if (mode === "fortime") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuración FOR TIME</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimeInput
            id="forTimeCap"
            label="Time Cap"
            value={forTimeCap}
            onChange={onForTimeCapChange}
            disabled={isRunning || isPaused}
            allowEmpty
            max={59940}
          />
          <p className="text-sm text-muted-foreground">
            Tiempo límite para completar el entrenamiento. Déjalo vacío para
            cronómetro sin límite.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (mode === "otm") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuración OTM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <RoundsInput
              id="totalRounds"
              label="Número de Rondas"
              value={totalRounds}
              onChange={onTotalRoundsChange}
              disabled={isRunning || isPaused}
              min={1}
              max={99}
              placeholder="10"
            />
            <TimeInput
              id="workTime"
              label="Tiempo por ronda"
              value={workTime}
              onChange={onWorkTimeChange}
              disabled={isRunning || isPaused}
              max={3600}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Completa todos los ejercicios en este tiempo. El tiempo restante
            es tu descanso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
