"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DisciplineLevel } from "@/hooks/use-planification-data";

interface PlanificationHeaderProps {
  selectedDate: Date;
  isToday: boolean;
  formattedDate?: string;
  levels?: DisciplineLevel[];
  selectedLevelId?: number | null;
  onLevelChange?: (levelId: number) => void;
  disciplineName?: string;
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
    <div className="mb-6 flex flex-col items-start">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
        <div className="flex items-start gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isToday ? "Planificación de Hoy" : "Planificación"}
            </h1>
            {!isToday && formattedDate && (
              <p className="text-sm md:text-base text-zinc-400 font-medium mt-1">
                {formattedDate}
              </p>
            )}
          </div>
        </div>
        
        {/* Selector de nivel - solo si NO es planificación personalizada */}
        {!isPersonalized && levels.length > 0 && onLevelChange && (
          <div className="flex items-center gap-3">
            <Label htmlFor="level-select" className="text-sm font-semibold text-foreground whitespace-nowrap">
              Nivel:
            </Label>
            <Select
              value={selectedLevelId?.toString() || ''}
              onValueChange={(value) => onLevelChange(parseInt(value))}
              disabled={selectedLevelId === null}
            >
              <SelectTrigger id="level-select" className="w-[180px]">
                <SelectValue placeholder={selectedLevelId === null ? 'Cargando...' : 'Seleccionar'} />
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
    </div>
  );
}
