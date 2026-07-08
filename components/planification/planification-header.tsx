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
import { ChevronLeft, ChevronRight, ArrowLeft, Calculator } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";

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
  selectedDate,
  isToday,
  formattedDate,
  levels = [],
  selectedLevelId,
  onLevelChange,
  isPersonalized = false,
}: PlanificationHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", dateString);

    router.push(`/planification?${params.toString()}`);
  };

  const goToPreviousDay = () => {
    const previousDate = new Date(selectedDate);
    previousDate.setDate(previousDate.getDate() - 1);
    navigateToDate(previousDate);
  };

  const goToNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    navigateToDate(nextDate);
  };

  return (
    <div className="space-y-6">
      {/* Label + Título */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="h-11 w-11 rounded-none bg-primary/5 border-primary/50 text-primary hover:bg-primary/10 shrink-0"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
                Sesión Actual
              </p>
              <h1 className="text-3xl md:text-4xl font-bold italic text-primary">
                Planificación
              </h1>
            </div>
          </div>
          <div className="flex items-center justify-between w-full gap-2 mt-3">
            <button
              type="button"
              onClick={goToPreviousDay}
              className="flex items-center justify-center w-10 h-10 rounded-none bg-primary/5 border border-primary/50 text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              aria-label="Día anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/calendar")}
              className="text-sm text-primary font-semibold font-heading uppercase text-center flex-1 py-2 px-3 rounded-none border border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              aria-label="Ver calendario mensual"
            >
              {isToday ? "Hoy" : formattedDate}
            </button>
            <button
              type="button"
              onClick={goToNextDay}
              className="flex items-center justify-center w-10 h-10 rounded-none bg-primary/5 border border-primary/50 text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              aria-label="Día siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Selector de nivel + calculadora */}
      {!isPersonalized && levels.length > 0 && onLevelChange && (
        <div className="space-y-2">
          <Label
            htmlFor="level-select"
            className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground"
          >
            Nivel
          </Label>
          <div className="flex flex-row gap-3">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/rm-calculator")}
              className="rounded-none bg-primary/5 border-primary/50 text-primary hover:bg-primary/10 shrink-0"
            >
              Calculadora RM
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
