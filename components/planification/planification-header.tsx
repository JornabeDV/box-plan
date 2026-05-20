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
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanificationHeaderProps {
  selectedDate: Date;
  isToday: boolean;
  formattedDate?: string;
  levels?: DisciplineLevel[];
  selectedLevelId?: number | null;
  onLevelChange?: (levelId: number) => void;
  isPersonalized?: boolean;
}

export function PlanificationHeader({
  isToday,
  formattedDate,
  levels = [],
  selectedLevelId,
  onLevelChange,
  isPersonalized = false,
}: PlanificationHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Label + Título */}
      <div className="flex justify-start md:justify-between items-start gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 md:order-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Volver</span>
        </Button>
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
            Sesión Actual
          </p>
          <h1 className="text-3xl md:text-4xl font-bold italic text-primary">
            Planificación
          </h1>
          {!isToday && formattedDate && (
            <p className="text-sm text-muted-foreground mt-1">
              {formattedDate}
            </p>
          )}
        </div>
      </div>

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
              className="w-full max-w-xs bg-surface-container-high border-outline/20 text-primary font-semibold uppercase text-xs tracking-wider h-12"
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
    </div>
  );
}
