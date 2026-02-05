"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReplicatePlanificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (targetDate: Date, replaceExisting: boolean) => Promise<void>;
  sourceDate: Date | null;
  planificationCount: number;
  loading?: boolean;
}

export function ReplicatePlanificationModal({
  open,
  onOpenChange,
  onConfirm,
  sourceDate,
  planificationCount,
  loading = false,
}: ReplicatePlanificationModalProps) {
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [replaceExisting, setReplaceExisting] = useState<"add" | "replace">(
    "add"
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calcular días del mes para el calendario grande
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Lunes = 0

  const weekDays = ["L", "M", "X", "J", "V", "S", "D"];
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    const date = new Date(year, month, day);
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (day: number) => {
    if (!targetDate) return false;
    const date = new Date(year, month, day);
    return date.toDateString() === targetDate.toDateString();
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    setTargetDate(date);
    setCalendarOpen(false);
  };

  // Generar array de días
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const handleSubmit = async () => {
    if (!targetDate) return;

    await onConfirm(targetDate, replaceExisting === "replace");

    // Resetear formulario
    setTargetDate(undefined);
    setReplaceExisting("add");
    setCalendarOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
        <DialogHeader className="pr-0 h-auto">
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Replicar Planificaciones
          </DialogTitle>
          <DialogDescription className="text-left">
            {planificationCount === 1
              ? "Duplicar esta planificación a otro día"
              : `Replicar ${planificationCount} planificaciones a otro día`}
            {sourceDate && (
              <span className="block mt-1 text-xs">
                Desde:{" "}
                {sourceDate.toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selector de fecha */}
          <div className="space-y-2 relative">
            <Label htmlFor="target-date">Fecha destino *</Label>
            <button
              id="target-date"
              type="button"
              onClick={() => setCalendarOpen(!calendarOpen)}
              className={cn(
                "w-full flex items-center justify-start text-left font-normal border-2 border-lime-400/50 bg-transparent text-lime-400 hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] rounded-xl h-11 px-6 py-2.5",
                !targetDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {targetDate ? (
                format(targetDate, "PPP", { locale: es })
              ) : (
                <span className="text-sm md:text-base placeholder:text-sm md:placeholder:text-base">Seleccionar fecha</span>
              )}
            </button>

            {/* Calendario flotante */}
            {calendarOpen && (
              <div className="absolute top-full left-0 right-0 z-50 border rounded-lg p-2 sm:p-4 bg-card shadow-lg overflow-hidden mt-1 -mx-6 sm:mx-0">
                <div className="space-y-2 sm:space-y-4 w-full">
                  {/* Navegación del mes */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToPreviousMonth}
                      className="h-6 w-6 sm:h-10 sm:w-10 hover:bg-primary/10 hover:text-primary"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>

                    <h3 className="text-sm sm:text-lg font-heading font-bold text-foreground">
                      {monthNames[month]} {year}
                    </h3>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToNextMonth}
                      className="h-6 w-6 sm:h-10 sm:w-10 hover:bg-primary/10 hover:text-primary"
                    >
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  {/* Días de la semana */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 w-full">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="text-center text-[10px] sm:text-xs font-bold text-muted-foreground py-0.5 sm:py-1 min-w-0"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Días del mes */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1 w-full">
                    {days.map((day, index) => {
                      if (day === null) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="aspect-square min-h-[20px] sm:min-h-[32px]"
                          />
                        );
                      }

                      const isCurrentDay = isToday(day);
                      const isSelectedDay = isSelected(day);

                      return (
                        <div
                          key={`day-${day}`}
                          className="aspect-square min-h-[20px] sm:min-h-[32px] min-w-0"
                        >
                          <button
                            type="button"
                            onClick={() => handleDayClick(day)}
                            className={cn(
                              "w-full h-full flex items-center justify-center text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-all duration-200 p-0 sm:p-1 cursor-pointer",
                              isSelectedDay
                                ? "bg-primary text-primary-foreground shadow-md"
                                : isCurrentDay
                                ? "bg-primary/20 text-primary-foreground border border-primary sm:border-2"
                                : "bg-background border border-muted-foreground/20 text-foreground hover:bg-accent/20 hover:border-accent/30"
                            )}
                          >
                            {day}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Opciones de replicación */}
          <div className="space-y-2">
            <Label>Opciones</Label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setReplaceExisting("add")}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 transition-all duration-200",
                  replaceExisting === "add"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:bg-accent/5 hover:border-accent/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        replaceExisting === "add"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground bg-background"
                      )}
                    >
                      {replaceExisting === "add" && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      Agregar a fecha existente
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Las planificaciones se agregarán junto con las que ya
                      existan
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReplaceExisting("replace")}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 transition-all duration-200",
                  replaceExisting === "replace"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:bg-accent/5 hover:border-accent/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        replaceExisting === "replace"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground bg-background"
                      )}
                    >
                      {replaceExisting === "replace" && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      Reemplazar planificaciones existentes
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Se eliminarán las planificaciones existentes antes de
                      agregar las nuevas
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setTargetDate(undefined);
              setReplaceExisting("add");
              setCalendarOpen(false);
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !targetDate}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Replicando...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Replicar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
