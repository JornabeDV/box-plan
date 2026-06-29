"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Dumbbell, Hash, Trophy, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ScoreMetric, ScoreConfig, WorkoutBlockResult } from "./types";

interface BlockScoreInputProps {
  planificationBlockId: string;
  config: ScoreConfig;
  existingResult?: WorkoutBlockResult | null;
  onSave: (
    planificationBlockId: string,
    metric: ScoreMetric,
    value: any
  ) => Promise<WorkoutBlockResult | null>;
  saving?: boolean;
}

const formatTime = (totalSeconds: number | null): string => {
  if (!totalSeconds) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export function BlockScoreInput({
  planificationBlockId,
  config,
  existingResult,
  onSave,
  saving,
}: BlockScoreInputProps) {
  const { toast } = useToast();
  const metric = config.metric;

  const existingValue = existingResult?.value || {};

  const [minutes, setMinutes] = useState<string>(
    existingValue.seconds ? String(Math.floor(existingValue.seconds / 60)) : ""
  );
  const [seconds, setSeconds] = useState<string>(
    existingValue.seconds ? String(existingValue.seconds % 60) : ""
  );
  const [weight, setWeight] = useState<string>(
    existingValue.weight ? String(existingValue.weight) : ""
  );
  const [reps, setReps] = useState<string>(
    existingValue.reps ? String(existingValue.reps) : ""
  );
  const [rounds, setRounds] = useState<string>(
    existingValue.rounds ? String(existingValue.rounds) : ""
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async () => {
    let value: any = {};

    switch (metric) {
      case "time": {
        const mins = parseInt(minutes) || 0;
        const secs = parseInt(seconds) || 0;
        if (mins === 0 && secs === 0) {
          toast({
            title: "Error",
            description: "Debes ingresar un tiempo",
            variant: "destructive",
          });
          return;
        }
        value = { seconds: mins * 60 + secs };
        break;
      }
      case "weight": {
        const w = parseFloat(weight);
        if (isNaN(w) || w <= 0) {
          toast({
            title: "Error",
            description: "Debes ingresar un peso válido",
            variant: "destructive",
          });
          return;
        }
        value = { weight: w, unit: config.unit || "kg" };
        break;
      }
      case "reps": {
        const r = parseInt(reps);
        if (isNaN(r) || r < 0) {
          toast({
            title: "Error",
            description: "Debes ingresar un número de reps válido",
            variant: "destructive",
          });
          return;
        }
        value = { reps: r };
        break;
      }
      case "rounds_reps": {
        const rds = parseInt(rounds) || 0;
        const rps = parseInt(reps) || 0;
        if (rds === 0 && rps === 0) {
          toast({
            title: "Error",
            description: "Debes ingresar rounds y/o reps",
            variant: "destructive",
          });
          return;
        }
        value = { rounds: rds, reps: rps };
        break;
      }
    }

    const result = await onSave(planificationBlockId, metric, value);

    if (result) {
      toast({
        title: "¡Resultado guardado!",
        description: config.includeInRanking
          ? "Tu resultado participará en el ranking."
          : "Resultado registrado.",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo guardar el resultado.",
        variant: "destructive",
      });
    }
  };

  const renderInput = () => {
    switch (metric) {
      case "time":
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Minutos</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Segundos</Label>
              <Input
                type="number"
                min="0"
                max="59"
                placeholder="0"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        );
      case "weight":
        return (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Peso ({config.unit || "kg"})
            </Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-9"
            />
          </div>
        );
      case "reps":
        return (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Reps</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="h-9"
            />
          </div>
        );
      case "rounds_reps":
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Rounds</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Reps</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (metric) {
      case "time":
        return <Clock className="w-4 h-4" />;
      case "weight":
        return <Dumbbell className="w-4 h-4" />;
      case "rounds_reps":
        return <Trophy className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const getTitle = () => {
    if (config.label) return config.label;
    switch (metric) {
      case "time":
        return "Tiempo";
      case "weight":
        return "Peso";
      case "reps":
        return "Reps";
      case "rounds_reps":
        return "Rounds + Reps";
    }
  };

  const getExistingDisplayValue = () => {
    if (!existingResult) return null;
    switch (metric) {
      case "time":
        return formatTime(existingValue.seconds || 0);
      case "weight":
        return `${existingValue.weight || 0} ${existingValue.unit || "kg"}`;
      case "reps":
        return `${existingValue.reps || 0} reps`;
      case "rounds_reps":
        return `${existingValue.rounds || 0} rounds + ${existingValue.reps || 0} reps`;
      default:
        return null;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mt-4 bg-primary/5 py-0 border-primary/20 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between p-0 px-2 sm:p-4 text-left hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-primary flex-shrink-0">{getIcon()}</span>
              <span className="text-sm font-medium text-foreground truncate">
                {getTitle()}
              </span>
              {existingResult && (
                <span className="text-sm font-bold text-primary flex-shrink-0">
                  {getExistingDisplayValue()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {config.includeInRanking && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  <Trophy className="w-3 h-3" />
                  Ranking
                </span>
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0 pb-3 sm:pb-4 px-3 sm:px-4">
            {existingResult && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-md">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-primary">Registrado</p>
                  <p className="text-sm font-bold text-foreground">
                    {getExistingDisplayValue()}
                  </p>
                </div>
              </div>
            )}

            {renderInput()}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : existingResult ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Actualizar
                </>
              ) : (
                <>
                  {getIcon()}
                  <span className="ml-2">Guardar</span>
                </>
              )}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
