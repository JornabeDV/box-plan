"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WorkoutScore } from "./types";

interface StrengthScoreFormProps {
  planificationId: string;
  existingWorkout: WorkoutScore | null;
  onSave: (workout: WorkoutScore) => void;
}

export function StrengthScoreForm({
  planificationId,
  existingWorkout,
  onSave,
}: StrengthScoreFormProps) {
  const { toast } = useToast();
  const [weight, setWeight] = useState<string>(
    existingWorkout?.weight ? String(existingWorkout.weight) : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!weight.trim()) {
      toast({
        title: "Error de validación",
        description: "Debes ingresar un peso",
        variant: "destructive",
      });
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast({
        title: "Error de validación",
        description: "El peso debe ser un número mayor a 0",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const completedAt = new Date().toISOString();

      const workout: WorkoutScore = {
        id: existingWorkout?.id || "",
        duration_seconds: null,
        completed_at: completedAt,
        weight: weightNum,
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
          <Dumbbell className="w-6 h-6 text-lime-400" />
          Score de Fuerza
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingWorkout && existingWorkout.weight && (
          <div className="flex items-center gap-2 p-3 bg-lime-400/10 border border-lime-400/20 rounded-md">
            <CheckCircle2 className="w-5 h-5 text-lime-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-lime-400">
                Peso registrado
              </p>
              <p className="text-lg font-bold text-white">
                {existingWorkout.weight} kg
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="strength-weight">Peso (kg)</Label>
          <Input
            id="strength-weight"
            type="number"
            min="0"
            step="0.1"
            placeholder="0.0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
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
              Actualizar Peso
            </>
          ) : (
            <>
              <Dumbbell className="w-4 h-4 mr-2" />
              Guardar Peso
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
