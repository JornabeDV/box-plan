"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useMonthPlanifications } from "@/hooks/use-month-planifications";

interface DisciplineInfo {
  id: number;
  name: string;
  color: string;
}

interface FullCalendarProps {
  discipline?: DisciplineInfo | null;
}

/**
 * Componente FullCalendar - Calendario mensual completo
 * Permite navegar entre meses y hacer click en días para ver entrenamientos
 */
export function FullCalendar({ discipline }: FullCalendarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todayHasWorkout, setTodayHasWorkout] = useState(false);

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { datesWithPlanification, personalizedDays, loading } = useMonthPlanifications(
    year,
    month + 1,
    discipline?.id ?? null
  );

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
    const today = new Date();
    setCurrentDate(today);

    // Formatear fecha como YYYY-MM-DD
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    // Redirigir a la planilla de hoy de la disciplina seleccionada
    const url = discipline
      ? `/planification?date=${dateString}&disciplineId=${discipline.id}`
      : `/planification?date=${dateString}`;
    router.push(url);
  };

  // Verificar si hoy tiene planificación (respetando el filtro de disciplina)
  useEffect(() => {
    const checkTodayWorkout = async () => {
      if (!user?.id) {
        setTodayHasWorkout(false);
        return;
      }

      try {
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth() + 1;
        const params = new URLSearchParams({
          year: todayYear.toString(),
          month: todayMonth.toString(),
        });
        if (discipline?.id != null) {
          params.append("disciplineId", discipline.id.toString());
        }

        const response = await fetch(
          `/api/planifications/month?${params.toString()}`
        );

        if (!response.ok) {
          setTodayHasWorkout(false);
          return;
        }

        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
          setTodayHasWorkout(data.data.includes(today.getDate()));
        } else {
          setTodayHasWorkout(false);
        }
      } catch (err) {
        console.error("Error checking today workout:", err);
        setTodayHasWorkout(false);
      }
    };

    checkTodayWorkout();
  }, [user?.id, discipline?.id]);

  // Verificar si un día tiene planificación
  const hasWorkout = (day: number) => {
    return datesWithPlanification.includes(day);
  };

  const isPersonalizedDay = (day: number) => {
    return personalizedDays.includes(day);
  };

  // Verificar si es hoy
  const isToday = (day: number) => {
    const date = new Date(year, month, day);
    return date.toDateString() === today.toDateString();
  };

  // Verificar si es un día pasado
  const isPastDay = (day: number) => {
    const date = new Date(year, month, day);
    return date < today && !isToday(day);
  };

  // Manejar click en un día - Solo si tiene planificación
  const handleDayClick = (day: number) => {
    if (!hasWorkout(day)) {
      return;
    }
    const date = new Date(year, month, day);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateString = `${y}-${m}-${d}`;
    const url = discipline
      ? `/planification?date=${dateString}&disciplineId=${discipline.id}`
      : `/planification?date=${dateString}`;
    router.push(url);
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

  return (
    <Card>
      <CardHeader className="pb-4">
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
            disabled={!todayHasWorkout}
            className="text-sm font-semibold hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
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

            const hasWorkoutValue = hasWorkout(day);
            const isCurrentDay = isToday(day);
            const isPersonalized = isPersonalizedDay(day);
            const isPast = isPastDay(day);
            const isClickable = hasWorkoutValue;
            const todayHasWorkoutValue = isCurrentDay && hasWorkoutValue;

            return (
              <div
                key={`day-${day}-${month}-${year}`}
                className="aspect-square"
              >
                <div
                  className={`
                    relative w-full h-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                    ${
                      isCurrentDay
                        ? todayHasWorkoutValue
                          ? `bg-primary text-primary-foreground shadow-accent animate-pulse-glow border-2 ${isPersonalized ? "border-amber-400" : "border-primary-foreground/60"}`
                          : "bg-primary text-primary-foreground shadow-accent animate-pulse-glow"
                        : isPersonalized
                        ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:scale-105 border-2 border-amber-500/50"
                        : hasWorkoutValue
                        ? discipline
                          ? "hover:scale-105 border-2 text-foreground"
                          : "bg-primary/15 text-primary hover:bg-primary/25 hover:scale-105 border-2 border-primary/40"
                        : "bg-background border border-muted-foreground/20 text-muted-foreground"
                    }
                    ${isClickable ? "cursor-pointer" : "cursor-default"}
                    ${isPast ? "opacity-50" : ""}
                  `}
                  style={
                    todayHasWorkoutValue
                      ? isPersonalized
                        ? undefined
                        : discipline
                        ? { borderColor: discipline.color }
                        : undefined
                      : !isCurrentDay && hasWorkoutValue && !isPersonalized && discipline
                      ? {
                          borderColor: discipline.color,
                          backgroundColor: discipline.color + "18",
                        }
                      : undefined
                  }
                  onClick={isClickable ? () => handleDayClick(day) : undefined}
                >
                  <span className="text-sm">{day}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center justify-between sm:justify-center gap-2 sm:gap-6 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-xs text-muted-foreground">Hoy</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div
              className="w-3 h-3 rounded-full border-2"
              style={
                discipline
                  ? {
                      backgroundColor: discipline.color + "18",
                      borderColor: discipline.color,
                    }
                  : { backgroundColor: "hsl(var(--primary) / 0.15)", borderColor: "hsl(var(--primary) / 0.4)" }
              }
            ></div>
            <span className="text-xs text-muted-foreground">
              {discipline ? `Días de ${discipline.name}` : "Días de entrenamiento"}
            </span>
          </div>
          {personalizedDays.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-3 h-3 rounded-full border-2 bg-amber-500/20 border-amber-500/50"></div>
              <span className="text-xs text-muted-foreground">
                Personalizado
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 bg-background border-2 border-muted-foreground/40 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Día libre</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
