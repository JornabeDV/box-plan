import { Activity } from "lucide-react"
import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar"

/**
 * Componente TodaySection - Sección del día actual
 * Muestra la fecha y calendario mensual
 */
export function TodaySection() {
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

      <MonthlyCalendar />
    </section>
  )
}

