"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";

interface DayPlan {
  date: string;
  title: string | null;
  description: string | null;
  isCompleted: boolean;
}

interface UpcomingDay {
  date: Date;
  dateStr: string;
  dayName: string;
  dayNumber: number;
  plan: DayPlan | null;
  isToday: boolean;
  isPast: boolean;
}

/**
 * Componente MonthlyCalendar - Widget de próximos 4 días
 * Muestra los próximos 4 días con sus entrenamientos y estados
 */
export function MonthlyCalendar() {
  const { user } = useAuth();
  const router = useRouter();
  const [upcomingDays, setUpcomingDays] = useState<UpcomingDay[]>([]);
  const upcomingDaysRef = useRef<UpcomingDay[]>([]);
  const [loading, setLoading] = useState(false);

  // Sincronizar ref con estado
  useEffect(() => {
    upcomingDaysRef.current = upcomingDays;
  }, [upcomingDays]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generar los próximos 4 días
  useEffect(() => {
    const days: UpcomingDay[] = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayNames = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      days.push({
        date,
        dateStr: `${year}-${month}-${day}`,
        dayName: dayNames[date.getDay()],
        dayNumber: date.getDate(),
        plan: null,
        isToday: i === 0,
        isPast: false,
      });
    }
    setUpcomingDays(days);
  }, []);

  // Cargar planificaciones del rango
  useEffect(() => {
    const fetchRangePlanifications = async () => {
      if (!user?.id || upcomingDays.length === 0) return;

      try {
        setLoading(true);
        const currentDays = upcomingDaysRef.current;
        const start = currentDays[0].dateStr;
        const end = currentDays[currentDays.length - 1].dateStr;

        const response = await fetch(
          `/api/planifications/range?start=${start}&end=${end}`,
        );

        if (!response.ok) {
          console.error("Error fetching range planifications");
          return;
        }

        const result = await response.json();
        const plans: DayPlan[] = result.data || [];

        // Mapear planificaciones por fecha
        const plansByDate = new Map<string, DayPlan>();
        plans.forEach((plan) => {
          plansByDate.set(plan.date, plan);
        });

        setUpcomingDays((prev) =>
          prev.map((d) => ({
            ...d,
            plan: plansByDate.get(d.dateStr) || null,
          })),
        );
      } catch (err) {
        console.error("Error fetching range planifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRangePlanifications();
  }, [user?.id, upcomingDays.length]);

  const getStatus = (day: UpcomingDay) => {
    if (!day.plan)
      return { label: "Sin entrenamiento", color: "text-muted-foreground" };
    if (day.plan.isCompleted)
      return { label: "Completado", color: "text-muted-foreground" };
    if (day.isToday) return { label: "En progreso", color: "text-primary" };
    return { label: "Programado", color: "text-muted-foreground" };
  };

  const handleDayClick = (day: UpcomingDay) => {
    router.push(`/planification?date=${day.dateStr}`);
  };

  const handleViewFullCalendar = () => {
    router.push("/calendar");
  };

  return (
    <Card className="bg-surface-container p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="headline-md text-foreground">Calendario</h2>
        <CalendarIcon className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Lista de próximos días */}
      <div>
        {upcomingDays.map((day, index) => {
          const status = getStatus(day);
          const isToday = day.isToday;
          const hasPlan = !!day.plan;
          const isLast = index === upcomingDays.length - 1;

          return (
            <div key={day.dateStr}>
              {hasPlan ? (
                <button
                  onClick={() => handleDayClick(day)}
                  className="w-full flex items-center gap-4 group py-2"
                >
                  {/* Fecha */}
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center w-14 h-14 shrink-0 transition-colors",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-container-high text-foreground",
                    )}
                  >
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      {day.dayName}
                    </span>
                    <span className="text-xl font-bold leading-none">
                      {day.dayNumber}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <p
                      className={cn(
                        "font-semibold text-sm transition-colors",
                        isToday ? "text-primary" : "text-foreground",
                      )}
                    >
                      {day.plan?.title || "Entrenamiento"}
                    </p>
                    <p className={cn("text-xs italic", status.color)}>
                      {status.label}
                    </p>
                  </div>

                  {/* Flecha */}
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <div className="w-full flex items-center gap-4 py-2">
                  {/* Fecha */}
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center w-14 h-14 shrink-0 transition-colors",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-container-high text-foreground",
                    )}
                  >
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      {day.dayName}
                    </span>
                    <span className="text-xl font-bold leading-none">
                      {day.dayNumber}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <p className={cn("text-sm italic", status.color)}>
                      {status.label}
                    </p>
                  </div>
                </div>
              )}
              {!isLast && <div className="h-px bg-border/30 mx-14" />}
            </div>
          );
        })}
      </div>

      {/* Botón ver calendario completo */}
      <Button
        variant="outline"
        onClick={handleViewFullCalendar}
        className="w-full text-sm font-semibold tracking-widest uppercase text-muted-foreground hover:text-primary hover:bg-primary/10 text-primary bg-primary/10"
      >
        Ver calendario completo
      </Button>
    </Card>
  );
}
