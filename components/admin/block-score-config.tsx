"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Dumbbell, Hash, Trophy } from "lucide-react";

export type ScoreMetric = "time" | "weight" | "reps" | "rounds_reps";

export interface ScoreConfig {
  metric?: ScoreMetric;
  includeInRanking?: boolean;
  label?: string;
  unit?: "kg" | "lb";
}

interface BlockScoreConfigProps {
  config: ScoreConfig | null | undefined;
  onChange: (config: ScoreConfig | null) => void;
}

export function BlockScoreConfig({ config, onChange }: BlockScoreConfigProps) {
  const enabled = !!config?.metric;

  const handleToggle = (checked: boolean) => {
    if (checked) {
      onChange({ metric: "time", includeInRanking: true });
    } else {
      onChange(null);
    }
  };

  const updateConfig = (updates: Partial<ScoreConfig>) => {
    if (!config) return;
    onChange({ ...config, ...updates });
  };

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-md border border-muted space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium cursor-pointer" htmlFor="score-toggle">
            Pedir resultado al alumno
          </Label>
        </div>
        <Switch
          id="score-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {enabled && config && (
        <div className="space-y-3 pl-6 border-l-2 border-primary/20">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Métrica</Label>
              <Select
                value={config.metric}
                onValueChange={(value) =>
                  updateConfig({ metric: value as ScoreMetric })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Tiempo
                    </div>
                  </SelectItem>
                  <SelectItem value="weight">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-3 h-3" />
                      Peso
                    </div>
                  </SelectItem>
                  <SelectItem value="reps">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3" />
                      Reps
                    </div>
                  </SelectItem>
                  <SelectItem value="rounds_reps">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-3 h-3" />
                      Rounds + Reps
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.metric === "weight" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Unidad</Label>
                <Select
                  value={config.unit || "kg"}
                  onValueChange={(value) =>
                    updateConfig({ unit: value as "kg" | "lb" })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Etiqueta (opcional)
            </Label>
            <Input
              value={config.label || ""}
              onChange={(e) => updateConfig({ label: e.target.value })}
              placeholder="Ej: Tiempo del WOD"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="ranking-toggle"
              checked={config.includeInRanking ?? true}
              onCheckedChange={(checked) =>
                updateConfig({ includeInRanking: checked })
              }
            />
            <Label className="text-xs cursor-pointer" htmlFor="ranking-toggle">
              Incluir en ranking
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}
