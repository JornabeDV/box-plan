"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WorkoutScore } from "./types";

interface WodScoreFormProps {
  planificationId: string;
  existingWorkout: WorkoutScore | null;
  onSave: (workout: WorkoutScore) => void;
}

const formatTime = (totalSeconds: number | null): string => {
  if (!totalSeconds) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export function WodScoreForm({
  planificationId,
  existingWorkout,
  onSave,
}: WodScoreFormProps) {
  const { toast } = useToast();
  const [minutes, setMinutes] = useState<string>(
    existingWorkout?.duration_seconds
      ? String(Math.floor(existingWorkout.duration_seconds / 60))
      : ""
  );
  const [seconds, setSeconds] = useState<string>(
    existingWorkout?.duration_seconds
      ? String(existingWorkout.duration_seconds % 60)
      : ""
  );
  const [saving, setSaving] = useState(false);

  const validateTime = (mins: string, secs: string): boolean => {
    const minutesNum = parseInt(mins) || 0;
    const secondsNum = parseInt(secs) || 0;
    return minutesNum >= 0 && secondsNum >= 0 && secondsNum < 60;
  };

  const handleSubmit = async () => {
    if (!minutes.trim() || !seconds.trim()) {
      toast({
        title: "Error de validación",
        description: "Debes ingresar minutos y segundos",
        variant: "destructive",
      });
      return;
    }

    if (!validateTime(minutes, seconds)) {
      toast({
        title: "Error de validación",
        description: "Los segundos deben estar entre 0 y 59",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const minutesNum = parseInt(minutes) || 0;
      const secondsNum = parseInt(seconds) || 0;
      const durationSeconds = minutesNum * 60 + secondsNum;
      const completedAt = new Date().toISOString();

      const workout: WorkoutScore = {
        id: existingWorkout?.id || "",
        duration_seconds: durationSeconds,
        completed_at: completedAt,
      };

      await onSave(workout);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-white">
          <Clock className="w-6 h-6 text-lime-400" />
          Tiempo del WOD
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingWorkout && existingWorkout.duration_seconds && (
          <div className="flex items-center gap-2 p-3 bg-lime-400/10 border border-lime-400/20 rounded-md">
            <CheckCircle2 className="w-5 h-5 text-lime-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-lime-400">
                Tiempo registrado
              </p>
              <p className="text-lg font-bold text-white">
                {formatTime(existingWorkout.duration_seconds)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wod-minutes">Minutos</Label>
            <Input
              id="wod-minutes"
              type="number"
              min="0"
              placeholder="0"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wod-seconds">Segundos</Label>
            <Input
              id="wod-seconds"
              type="number"
              min="0"
              max="59"
              placeholder="0"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : existingWorkout ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Actualizar Tiempo
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Guardar Tiempo
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
