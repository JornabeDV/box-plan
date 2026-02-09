"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMonthPlanifications } from "@/hooks/use-month-planifications";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserPreferences } from "@/hooks/use-current-user-preferences";
import { PreferenceSelector } from "./preference-selector";

interface TrialCalendarProps {
  onDateClick?: (date: Date) => void;
  coachId?: number | null;
}

/**
 * Componente TrialCalendar - Calendario para usuarios sin suscripción
 * Muestra el calendario completo pero solo permite acceso al día de hoy
 * Los demás días redirigen a /pricing
 */
export function TrialCalendar({ onDateClick, coachId }: TrialCalendarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const {
    preferences,
    loading: preferencesLoading,
    refetch: refetchPreferences,
  } = useCurrentUserPreferences();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12
  const todayDay = today.getDate();

  // Obtener planificaciones del mes, filtradas por la disciplina preferida del usuario
  const { datesWithPlanification, loading } = useMonthPlanifications(
    year,
    month,
    preferences?.preferredDisciplineId || null
  );

  // Si no hay preferencias configuradas, mostrar el selector
  if (
    !preferencesLoading &&
    (!preferences ||
      !preferences.preferredDisciplineId ||
      !preferences.preferredLevelId)
  ) {
    return (
      <PreferenceSelector
        coachId={coachId ?? null}
        onPreferencesSaved={() => {
          refetchPreferences();
        }}
      />
    );
  }

  if (preferencesLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-2 border-border shadow-soft">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Cargando calendario...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!coachId) {
    return null;
  }

  // Calcular días del mes
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Lunes = 0

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
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);

    // Formatear fecha como YYYY-MM-DD
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    // Redirigir a la planilla de hoy
    router.push(`/planification?date=${dateString}`);
  };

  const hasWorkout = (day: number) => {
    return datesWithPlanification.includes(day);
  };

  const isToday = (day: number) => {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    return dateStr === todayStr;
  };

  const isCurrentMonth = () => {
    return (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth()
    );
  };

  const isBlocked = (day: number) => {
    // Solo el día de hoy está desbloqueado (si tiene planificación)
    if (isCurrentMonth() && isToday(day) && hasWorkout(day)) {
      return false;
    }
    // Todos los demás días están bloqueados
    return hasWorkout(day);
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month - 1, day);

    // Solo permitir acceso al día de hoy si tiene planificación
    if (isCurrentMonth() && isToday(day) && hasWorkout(day)) {
      if (onDateClick) {
        onDateClick(date);
      }
      return;
    }

    // Si tiene planificación pero está bloqueado, redirigir a pricing
    if (isBlocked(day)) {
      toast({
        title: "Suscríbete para acceder",
        description:
          "Suscríbete para acceder a todos tus entrenamientos personalizados.",
        variant: "default",
      });
      router.push("/pricing");
      return;
    }

    // Si no tiene planificación, no hacer nada
  };

  // Generar array de días
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-2 border-border shadow-soft">
      <CardHeader className="pb-4">
        <div className="text-center mb-4">
          <CardTitle className="text-base md:text-xl font-heading text-foreground flex items-center justify-center gap-2">
            <CalendarIcon className="w-4 h-4 md:w-5 md:h-5" />
            Calendario de Entrenamientos
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Accede a tu entrenamiento de hoy. Suscríbete!
          </p>
          {preferences?.discipline && (
            <Badge variant="outline" className="mt-2">
              {preferences.discipline.name} - {preferences.level?.name}
            </Badge>
          )}
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
            {monthNames[month - 1]} {year}
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Cargando calendario...</div>
          </div>
        ) : (
          <>
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className="text-center text-sm font-bold text-muted-foreground py-2"
                >
                  <span className="md:hidden">{day}</span>
                  <span className="hidden md:inline">
                    {weekDaysFull[index]}
                  </span>
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                if (day === null) {
                  return (
                    <div key={`empty-${index}`} className="aspect-square" />
                  );
                }

                const hasWorkoutValue = hasWorkout(day);
                const isCurrentDay = isToday(day);
                const isBlockedDay = isBlocked(day);
                const isTodayUnlocked =
                  isCurrentMonth() && isCurrentDay && hasWorkoutValue;

                return (
                  <div
                    key={`day-${day}-${month}-${year}`}
                    className="aspect-square"
                  >
                    <div
                      className={`
                        w-full h-full flex flex-col items-center justify-center text-sm font-semibold rounded-xl transition-all duration-200 relative
                        ${
                          isTodayUnlocked
                            ? "bg-primary text-primary-foreground shadow-lg border-2 border-primary hover:scale-105 cursor-pointer"
                            : isBlockedDay
                            ? "bg-muted/30 text-muted-foreground border-2 border-muted/50 hover:bg-muted/40 cursor-pointer opacity-60"
                            : hasWorkoutValue
                            ? "bg-accent/10 text-accent border border-accent/20 opacity-50"
                            : isCurrentDay
                            ? "bg-primary/20 text-primary-foreground border border-primary/30"
                            : "text-muted-foreground hover:bg-muted/20"
                        }
                        ${
                          isTodayUnlocked || isBlockedDay
                            ? "cursor-pointer"
                            : "cursor-default"
                        }
                      `}
                      onClick={() => handleDayClick(day)}
                    >
                      <span className="text-sm font-semibold">{day}</span>
                      {isTodayUnlocked && (
                        <Badge
                          variant="secondary"
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-green-500 text-white border-0"
                        >
                          <Unlock className="w-2.5 h-2.5" />
                        </Badge>
                      )}
                      {isBlockedDay && (
                        <Badge
                          variant="secondary"
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-muted text-muted-foreground border-0"
                        >
                          <Lock className="w-2.5 h-2.5" />
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full border-2 border-primary"></div>
                <span className="text-xs text-muted-foreground">
                  Hoy disponible
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted/30 border-2 border-muted/50 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Bloqueado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent/10 border border-accent/20 rounded-full"></div>
                <span className="text-xs text-muted-foreground">
                  Con entrenamiento
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
