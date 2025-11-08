"use client"

import { useRouter } from "next/navigation"
import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar"

/**
 * Componente TodaySection - Sección del día actual
 * Muestra la fecha y calendario mensual
 */
export function TodaySection() {
  const router = useRouter()

  const handleDateClick = (date: Date) => {
    // Formatear la fecha como YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    
    // Navegar a la página de planificación con la fecha seleccionada
    router.push(`/planification/today?date=${dateString}`)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-balance">
            Hoy, {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
          </h2>
          <p className="text-muted-foreground">¡Vamos por otro gran entrenamiento!</p>
        </div>
      </div>

      <MonthlyCalendar onDateClick={handleDateClick} />
    </section>
  )
}