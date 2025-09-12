import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Clock, ChevronRight, Target } from "lucide-react"

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

interface WODCardProps {
  wod?: WOD | null
  loading?: boolean
  onStartWOD?: () => void
}

/**
 * Componente WODCard - Tarjeta del Workout of the Day
 * Muestra la información del WOD actual con ejercicios y botón de inicio
 */
export function WODCard({ wod, loading = false, onStartWOD }: WODCardProps) {
  return (
    <Card className="mb-6 border-primary/30 bg-gradient-to-br from-card via-card/95 to-primary/5 shadow-xl shadow-primary/10 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      <CardHeader className="pb-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl text-primary">WOD del Día</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-lg"
          >
            {wod?.type?.toUpperCase() || 'METCON'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando WOD...</span>
          </div>
        ) : wod ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-accent/10 to-transparent p-4 rounded-xl border border-accent/20">
              <h4 className="font-bold text-xl text-accent mb-3">"{wod.name}"</h4>
              <p className="text-muted-foreground mb-4">{wod.description}</p>
              <div className="grid gap-3">
                {wod.exercises?.map((exercise, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-border/50">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="font-medium">
                      {exercise.name} {exercise.weight && `(${exercise.weight})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  Tiempo objetivo: {wod.duration_minutes ? `${wod.duration_minutes} min` : 'Variable'}
                </span>
              </div>
              <Button
                size="lg"
                onClick={onStartWOD}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 px-6"
              >
                Iniciar WOD
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay WOD para hoy</h3>
            <p className="text-muted-foreground">Vuelve mañana para tu próximo entrenamiento</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}