"use client"

import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar"

/**
 * Componente TodaySection - Sección del día actual
 * Muestra los próximos 4 días con entrenamientos
 */
export function TodaySection() {
  return (
    <section className="space-y-3">
      <MonthlyCalendar />
    </section>
  )
}
