import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Target, Clock, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  prThisWeek?: {
    exercise: string
    weight: string
    improvement: string
  }
  nextSession?: {
    time: string
    countdown: string
  }
}

/**
 * Componente StatsCards - Tarjetas de estadísticas del dashboard
 * Muestra PR de la semana y próxima sesión
 */
export function StatsCards({ 
  prThisWeek = { exercise: "Deadlift", weight: "140kg", improvement: "+5kg" },
  nextSession = { time: "Mañana 7:00", countdown: "En 14h" }
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card className="border-accent/30 bg-gradient-to-br from-card to-accent/5 shadow-lg shadow-accent/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center shadow-lg shadow-accent/25">
              <Trophy className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">PR esta semana</p>
              <p className="font-bold text-lg">{prThisWeek.exercise} {prThisWeek.weight}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-accent" />
                <span className="text-xs text-accent font-semibold">{prThisWeek.improvement}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-secondary/30 bg-gradient-to-br from-card to-secondary/5 shadow-lg shadow-secondary/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center shadow-lg shadow-secondary/25">
              <Target className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Próxima sesión</p>
              <p className="font-bold text-lg">{nextSession.time}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-secondary" />
                <span className="text-xs text-secondary font-semibold">{nextSession.countdown}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}