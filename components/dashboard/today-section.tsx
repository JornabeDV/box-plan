import { Activity } from "lucide-react"
import { WODCard } from "@/components/workout/wod-card"
import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar"

interface Exercise {
  name: string
  weight?: string
}

interface WOD {
  id: string
  name: string
  description: string
  type: 'metcon' | 'strength' | 'skill' | 'endurance'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes?: number
  exercises: Exercise[]
}

interface TodaySectionProps {
  todaysWOD?: WOD | null
  wodsLoading?: boolean
  onStartWOD?: () => void
}

/**
 * Componente TodaySection - Sección del día actual
 * Muestra la fecha, WOD del día y tarjetas de estadísticas
 */
export function TodaySection({ todaysWOD, wodsLoading = false, onStartWOD }: TodaySectionProps) {
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

      <WODCard 
        wod={todaysWOD} 
        loading={wodsLoading} 
        onStartWOD={onStartWOD} 
      />

      <MonthlyCalendar />
    </section>
  )
}

