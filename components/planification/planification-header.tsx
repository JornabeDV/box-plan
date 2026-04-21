"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DisciplineLevel } from "@/hooks/use-planification-data";

interface DisciplineOption {
  id: number;
  name: string;
  color: string;
  levelId: number | null;
  levelName: string | null;
}

interface PlanificationHeaderProps {
  selectedDate: Date;
  isToday: boolean;
  formattedDate?: string;
  levels?: DisciplineLevel[];
  selectedLevelId?: number | null;
  onLevelChange?: (levelId: number) => void;
  disciplineName?: string;
  isPersonalized?: boolean;
  selectedDisciplineId?: number | null;
  onDisciplineChange?: (disciplineId: number | null) => void;
  availableDisciplineOptions?: DisciplineOption[];
}

export function PlanificationHeader({
  isToday,
  formattedDate,
  levels = [],
  selectedLevelId,
  onLevelChange,
  isPersonalized = false,
  selectedDisciplineId,
  onDisciplineChange,
  availableDisciplineOptions,
}: PlanificationHeaderProps) {
  const hasMultipleDisciplines =
    availableDisciplineOptions && availableDisciplineOptions.length > 1;

  return (
    <div className="space-y-6">
      {/* Label + Título */}
      <div>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
          Sesión Actual
        </p>
        <h1 className="text-3xl md:text-4xl font-bold italic text-primary">
          Planificación
        </h1>
        {!isToday && formattedDate && (
          <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
        )}
      </div>

      {/* Selectores */}
      <div className="grid grid-cols-2 gap-4">
        {/* Selector de nivel */}
        {!isPersonalized && levels.length > 0 && onLevelChange && (
          <div className="space-y-2">
            <Label
              htmlFor="level-select"
              className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground"
            >
              Nivel
            </Label>
            <Select
              value={selectedLevelId?.toString() || ""}
              onValueChange={(value) => onLevelChange(parseInt(value))}
            >
              <SelectTrigger
                id="level-select"
                className="w-full bg-surface-container-high border-outline/20 text-primary font-semibold uppercase text-xs tracking-wider h-12"
              >
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={level.id.toString()}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Selector de disciplina */}
        {hasMultipleDisciplines && onDisciplineChange && (
          <div className="space-y-2">
            <Label
              htmlFor="discipline-select"
              className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground"
            >
              Disciplina
            </Label>
            <Select
              value={selectedDisciplineId?.toString() || "all"}
              onValueChange={(value) => {
                const disciplineId =
                  value === "all" ? null : parseInt(value, 10);
                onDisciplineChange(disciplineId);
              }}
            >
              <SelectTrigger
                id="discipline-select"
                className="w-full bg-surface-container-high border-outline/20 text-primary font-semibold uppercase text-xs tracking-wider h-12"
              >
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {availableDisciplineOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
