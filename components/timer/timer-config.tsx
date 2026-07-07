"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimerMode } from "@/hooks/use-timer";

function sanitizePositiveInt(
  value: string,
  options: { max?: number; min?: number; allowEmpty?: boolean } = {}
): string {
  const { max, min = 1, allowEmpty = false } = options;

  if (value === "") {
    return allowEmpty ? "" : String(min);
  }

  // Rechazar signos negativos, decimales y caracteres no numéricos
  if (!/^\d+$/.test(value)) {
    return String(min);
  }

  const num = parseInt(value, 10);
  if (Number.isNaN(num)) {
    return String(min);
  }

  if (num < min) return String(min);
  if (max !== undefined && num > max) return String(max);

  return value;
}

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
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Configuración TABATA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workTime">Trabajo (seg)</Label>
              <Input
                id="workTime"
                type="number"
                value={workTime}
                onChange={(e) => {
                  onWorkTimeChange(
                    sanitizePositiveInt(e.target.value, { min: 1, max: 999 })
                  );
                }}
                min="1"
                max="999"
                placeholder="20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restTime">Descanso (seg)</Label>
              <Input
                id="restTime"
                type="number"
                value={restTime}
                onChange={(e) => {
                  onRestTimeChange(
                    sanitizePositiveInt(e.target.value, { min: 1, max: 999 })
                  );
                }}
                min="1"
                max="999"
                placeholder="10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalRounds">Rondas</Label>
            <Input
              id="totalRounds"
              type="number"
              value={totalRounds}
              onChange={(e) => {
                onTotalRoundsChange(
                  sanitizePositiveInt(e.target.value, { min: 1, max: 99 })
                );
              }}
              min="1"
              max="20"
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
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Configuración AMRAP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amrapTime">Tiempo (minutos)</Label>
            <Input
              id="amrapTime"
              type="number"
              value={amrapTime}
              onChange={(e) => {
                onAmrapTimeChange(
                  sanitizePositiveInt(e.target.value, { min: 1, max: 999 })
                );
              }}
              min="1"
              max="999"
              placeholder="10"
              disabled={isRunning || isPaused}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalRounds">Número de rondas</Label>
            <Input
              id="totalRounds"
              type="number"
              value={totalRounds}
              onChange={(e) => {
                onTotalRoundsChange(
                  sanitizePositiveInt(e.target.value, { min: 1, max: 99 })
                );
              }}
              min="1"
              max="99"
              placeholder="1"
              disabled={isRunning || isPaused}
            />
          </div>
          {totalRoundsNum > 1 && (
            <div className="space-y-2">
              <Label htmlFor="restTime">Descanso entre rondas (segundos)</Label>
              <Input
                id="restTime"
                type="number"
                value={restTime}
                onChange={(e) => {
                  onRestTimeChange(
                    sanitizePositiveInt(e.target.value, { min: 0, max: 999 })
                  );
                }}
                min="0"
                max="999"
                placeholder="60"
                disabled={isRunning || isPaused}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (mode === "emom") {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Configuración EMOM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalRounds">Número de Rondas</Label>
            <Input
              id="totalRounds"
              type="number"
              value={totalRounds}
              onChange={(e) => {
                onTotalRoundsChange(
                  sanitizePositiveInt(e.target.value, { min: 1, max: 99 })
                );
              }}
              min="1"
              max="99"
              placeholder="10"
              disabled={isRunning || isPaused}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === "fortime") {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Configuración FOR TIME</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forTimeCap">Time Cap (minutos)</Label>
            <Input
              id="forTimeCap"
              type="number"
              value={forTimeCap}
              onChange={(e) => {
                onForTimeCapChange(
                  sanitizePositiveInt(e.target.value, {
                    min: 1,
                    max: 999,
                    allowEmpty: true,
                  })
                );
              }}
              min="1"
              max="999"
              placeholder="Sin límite"
              disabled={isRunning || isPaused}
            />
            <p className="text-sm text-muted-foreground">
              Tiempo límite para completar el entrenamiento. Déjalo vacío para
              cronómetro sin límite.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === "otm") {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Configuración OTM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalRounds">Número de Rondas</Label>
            <Input
              id="totalRounds"
              type="number"
              value={totalRounds}
              onChange={(e) => {
                onTotalRoundsChange(
                  sanitizePositiveInt(e.target.value, { min: 1, max: 99 })
                );
              }}
              min="1"
              max="99"
              placeholder="10"
              disabled={isRunning || isPaused}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workTime">Tiempo por ronda (minutos)</Label>
            <Input
              id="workTime"
              type="number"
              value={workTime}
              onChange={(e) => {
                onWorkTimeChange(
                  sanitizePositiveInt(e.target.value, { min: 1, max: 60 })
                );
              }}
              min="1"
              max="60"
              placeholder="2"
              disabled={isRunning || isPaused}
            />
            <p className="text-sm text-muted-foreground">
              Completa todos los ejercicios en este tiempo. El tiempo restante
              es tu descanso.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
