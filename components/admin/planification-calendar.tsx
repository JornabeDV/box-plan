"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Planification } from "@/hooks/use-planifications";
import { useCoachPlanFeatures } from "@/hooks/use-coach-plan-features";

interface PlanificationCalendarProps {
  planifications: Planification[];
  loading?: boolean;
  onDateClick: (date: Date) => void;
  onEditPlanification?: (planification: Planification) => void;
  onDeletePlanification?: (planificationId: string) => void;
  onViewDayPlanifications?: (
    date: Date,
    planifications: Planification[]
  ) => void;
}

export function PlanificationCalendar({
  planifications,
  loading = false,
  onDateClick,
  onEditPlanification,
  onDeletePlanification,
  onViewDayPlanifications,
}: PlanificationCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const {
    planificationWeeks,
    canLoadMonthlyPlanifications,
    canLoadUnlimitedPlanifications,
  } = useCoachPlanFeatures();

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Obtener el primer día del mes y cuántos días tiene
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Ajustar para que lunes sea 0, domingo sea 6
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

  // Días de la semana (lunes a domingo)
  const weekDays = ["L", "M", "X", "J", "V", "S", "D"];
  const weekDaysFull = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  // Nombres de los meses
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

  // Navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const todayDate = new Date();
    setCurrentDate(todayDate);
    // Abrir modal de planificación con fecha de hoy
    const dayPlanifications = getPlanificationsForDay(todayDate.getDate());
    if (dayPlanifications.length > 0) {
      onViewDayPlanifications?.(todayDate, dayPlanifications);
    } else {
      onDateClick(todayDate);
    }
  };

  // Normalizar fecha a formato YYYY-MM-DD sin considerar timezone
  const normalizeDate = (date: Date | string) => {
    if (typeof date === "string") {
      // Si ya es string, tomar solo la parte de la fecha
      return date.split("T")[0];
    }
    // Crear fecha local sin timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Verificar si un día tiene planificaciones
  const getPlanificationsForDay = (day: number) => {
    const date = new Date(year, month, day);
    const dateString = normalizeDate(date);
    return planifications.filter((p) => {
      const planDate = normalizeDate(p.date);
      return planDate === dateString;
    });
  };

  // Verificar si es hoy
  const isToday = (day: number) => {
    const date = new Date(year, month, day);
    return date.toDateString() === today.toDateString();
  };

  // Verificar si es un día pasado (comparando solo la fecha sin hora)
  const isPastDay = (day: number) => {
    const date = new Date(year, month, day);
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const compareDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return compareDate < todayDate;
  };

  // Calcular fecha máxima permitida según el plan
  const getMaxAllowedDate = () => {
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (canLoadUnlimitedPlanifications) {
      // Plan ELITE: sin límite (pero retornamos una fecha muy lejana para comparación)
      return new Date(todayDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 año adelante
    } else if (canLoadMonthlyPlanifications) {
      // Plan POWER: hasta 30 días adelante
      return new Date(todayDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (planificationWeeks > 0) {
      // Plan START: hasta X semanas adelante
      const maxDays = planificationWeeks * 7;
      return new Date(todayDate.getTime() + maxDays * 24 * 60 * 60 * 1000);
    } else {
      // Sin plan: solo hoy
      return todayDate;
    }
  };

  const maxAllowedDate = getMaxAllowedDate();

  // Verificar si un día futuro está bloqueado por el plan
  const isFutureDayBlocked = (day: number) => {
    const date = new Date(year, month, day);
    const compareDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // Si es pasado, no está bloqueado por esta razón (ya tiene su propia lógica)
    if (compareDate < todayDate) {
      return false;
    }

    // Si es futuro, verificar si excede el límite
    return compareDate > maxAllowedDate;
  };

  // Obtener mensaje explicativo para días bloqueados
  const getBlockedMessage = () => {
    if (canLoadUnlimitedPlanifications) {
      return "Puedes crear planificaciones sin límite";
    } else if (canLoadMonthlyPlanifications) {
      return "Tu plan permite cargar planificaciones hasta 30 días adelante";
    } else if (planificationWeeks > 0) {
      return `Tu plan permite cargar planificaciones hasta ${planificationWeeks} semana${
        planificationWeeks !== 1 ? "s" : ""
      } (${planificationWeeks * 7} días) adelante`;
    } else {
      return "Tu plan solo permite cargar planificaciones para el día actual";
    }
  };

  // Manejar click en un día
  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    const dayPlanifications = getPlanificationsForDay(day);

    // No permitir crear si está bloqueado por el plan
    if (isFutureDayBlocked(day) && dayPlanifications.length === 0) {
      return; // No hacer nada si está bloqueado y no tiene planificaciones
    }

    if (dayPlanifications.length > 0) {
      // Si el día tiene planificaciones, mostrar modal de detalles (permite ver/editar/eliminar/replicar)
      // Permitir ver/editar incluso si está bloqueado (ya tiene planificaciones existentes)
      onViewDayPlanifications?.(date, dayPlanifications);
    } else {
      // Si el día no tiene planificaciones, solo permitir crear si no está bloqueado
      if (!isPastDay(day) && !isFutureDayBlocked(day)) {
        onDateClick(date);
      }
      // Si es un día pasado o bloqueado sin planificaciones, no hacer nada
    }
  };

  // Generar array de días del mes
  const days = [];

  // Días vacíos del mes anterior
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando calendario...</p>
      </div>
    );
  }

  return (
    <Card className="max-sm:gap-3">
      <CardHeader className="pb-4">
        {/* Título y descripción */}
        <div className="text-center mb-4">
          <CardTitle className="text-base md:text-xl font-heading text-foreground">
            Calendario de Planificaciones
          </CardTitle>
        </div>

        {/* Navegación del mes */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="w-8 h-8 md:w-16 md:h-16 border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] transition-all duration-300"
          >
            <ChevronLeft className="w-4 h-4 md:w-10 md:h-10" />
          </Button>

          <h3 className="text-lg md:text-2xl font-heading font-bold text-foreground">
            {monthNames[month]} {year}
          </h3>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="w-8 h-8 md:w-16 md:h-16 border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] transition-all duration-300"
          >
            <ChevronRight className="w-4 h-4 md:w-10 md:h-10" />
          </Button>
        </div>

        {/* Botón Hoy */}
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-sm font-semibold hover:bg-primary/10 hover:text-primary"
          >
            Ir a Hoy
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className="text-center text-sm font-bold text-muted-foreground py-2"
            >
              <span className="md:hidden">{day}</span>
              <span className="hidden md:inline">{weekDaysFull[index]}</span>
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return (
                <div key={`empty-${index}`} className="aspect-square"></div>
              );
            }

            const dayPlanifications = getPlanificationsForDay(day);
            const isCurrentDay = isToday(day);
            const isPast = isPastDay(day);
            const isBlocked = isFutureDayBlocked(day);

            const dayContent = (
              <div
                className={`
                  w-full h-full flex items-center justify-center text-sm font-semibold rounded-xl transition-all duration-200 relative
                  ${
                    (isPast && dayPlanifications.length === 0) ||
                    (isBlocked && dayPlanifications.length === 0)
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }
                  ${
                    isPast && dayPlanifications.length > 0
                      ? "bg-accent/20 text-accent hover:bg-accent/30 hover:scale-105 border-2 border-accent/30"
                      : isPast
                      ? "bg-background border border-muted-foreground/10 text-muted-foreground opacity-50"
                      : isBlocked && dayPlanifications.length === 0
                      ? "bg-background border-2 border-dashed border-muted-foreground/30 text-muted-foreground opacity-50"
                      : isBlocked && dayPlanifications.length > 0
                      ? "bg-accent/20 text-accent hover:bg-accent/30 hover:scale-105 border-2 border-accent/30"
                      : isCurrentDay
                      ? "bg-primary text-primary-foreground shadow-accent animate-pulse-glow"
                      : dayPlanifications.length > 0
                      ? "bg-accent/20 text-accent hover:bg-accent/30 hover:scale-105 border-2 border-accent/30"
                      : "bg-background border border-muted-foreground/20 text-muted-foreground hover:bg-muted/50"
                  }
                `}
                onClick={() => handleDayClick(day)}
              >
                <span className="text-sm">{day}</span>
                {dayPlanifications.length > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 sm:top-1 sm:right-1 bg-accent text-accent-foreground text-[9px] sm:text-xs font-bold rounded-full w-3 h-3 sm:w-5 sm:h-5 flex items-center justify-center ${
                      isPast ? "opacity-50" : ""
                    }`}
                  >
                    {dayPlanifications.length}
                  </span>
                )}
                {isBlocked && dayPlanifications.length === 0 && (
                  <Info className="absolute bottom-0.5 right-0.5 w-2 h-2 sm:w-3 sm:h-3 text-muted-foreground opacity-60" />
                )}
              </div>
            );

            return (
              <div
                key={`day-${day}-${month}-${year}`}
                className="aspect-square"
              >
                {isBlocked && dayPlanifications.length === 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{dayContent}</TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs bg-popover text-popover-foreground cursor-pointer [&>svg]:hidden"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push("/pricing/coaches");
                      }}
                    >
                      <p className="text-xs font-medium">
                        {getBlockedMessage()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Actualiza tu plan para crear planificaciones más
                        adelante
                      </p>
                      <p className="text-xs text-primary font-semibold mt-2 underline">
                        Ver planes disponibles
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  dayContent
                )}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-xs text-muted-foreground">Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent/20 border-2 border-accent/30 rounded-full"></div>
            <span className="text-xs text-muted-foreground">
              Con planificaciones
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-background border-2 border-muted-foreground/40 rounded-full"></div>
            <span className="text-xs text-muted-foreground">
              Sin planificaciones
            </span>
          </div>
          {!canLoadUnlimitedPlanifications && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-background border-2 border-dashed border-muted-foreground/30 rounded-full opacity-50"></div>
              <span className="text-xs text-muted-foreground">
                Bloqueado por plan
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
