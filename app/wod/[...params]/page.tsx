"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Calendar, 
  Target, 
  Clock,
  Zap,
  CheckCircle
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"

interface Exercise {
  name: string
  weight?: string
  reps?: string
  sets?: string
  notes?: string
}

interface WOD {
  id: string
  name: string
  description: string
  type: 'metcon' | 'strength' | 'skill' | 'endurance'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes?: number
  exercises: Exercise[]
  instructions?: string
  scaling?: string
  tips?: string[]
  date: string
}

export default function WODByDatePage() {
  const params = useParams()
  const router = useRouter()
  const [wod, setWod] = useState<WOD | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    // Parsear la fecha de los parámetros
    const dateString = Array.isArray(params.params) ? params.params.join('-') : params.params
    const [year, month, day] = dateString.split('-').map(Number)
    
    if (year && month && day) {
      const date = new Date(year, month - 1, day)
      setSelectedDate(date)
      
      // Simular carga de WOD para esa fecha
      // En una app real, esto vendría de la API
      const mockWOD: WOD = {
        id: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        name: "Fran",
        description: "21-15-9 reps de:",
        type: "metcon",
        difficulty: "intermediate",
        duration_minutes: 8,
        exercises: [
          { name: "Thrusters", weight: "43kg/30kg", reps: "21-15-9" },
          { name: "Pull-ups", reps: "21-15-9" }
        ],
        instructions: "Completa 21 thrusters, luego 21 pull-ups. Descansa 1 minuto. Repite con 15 reps de cada ejercicio. Descansa 1 minuto. Finaliza con 9 reps de cada ejercicio.",
        scaling: "Si no puedes hacer pull-ups, usa bandas de resistencia o jumping pull-ups. Para thrusters, reduce el peso si es necesario.",
        tips: [
          "Mantén un ritmo constante en los thrusters",
          "No te cuelgues en los pull-ups - mantén el movimiento fluido",
          "Respira profundamente entre rondas",
          "Si necesitas parar, hazlo pero no te detengas por más de 10 segundos"
        ],
        date: dateString
      }
      
      setWod(mockWOD)
    }
    
    setLoading(false)
  }, [params.params])

  const handleGoBack = () => {
    router.push('/')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500'
      case 'intermediate': return 'bg-yellow-500'
      case 'advanced': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante'
      case 'intermediate': return 'Intermedio'
      case 'advanced': return 'Avanzado'
      default: return 'N/A'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
        <Header />
        <main className="p-6 pb-24">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Cargando WOD...</span>
          </div>
        </main>
        <BottomNavigation />
      </div>
    )
  }

  if (!wod || !selectedDate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
        <Header />
        <main className="p-6 pb-24">
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">WOD no encontrado</h2>
            <p className="text-muted-foreground mb-6">No hay entrenamiento programado para esta fecha</p>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al calendario
            </Button>
          </div>
        </main>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      <Header />
      
      <main className="p-6 space-y-6 pb-24">
        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">WOD del Día</h1>
            <p className="text-muted-foreground">{formatDate(selectedDate)}</p>
          </div>
        </div>

        {/* Información principal del WOD */}
        <Card className="border-primary/30 bg-gradient-to-br from-card via-card/95 to-primary/5 shadow-xl shadow-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-primary">"{wod.name}"</CardTitle>
                  <p className="text-muted-foreground">{wod.description}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={`${getDifficultyColor(wod.difficulty)} text-white`}>
                  {getDifficultyText(wod.difficulty)}
                </Badge>
                <Badge variant="secondary">
                  {wod.type.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(selectedDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Tiempo: {wod.duration_minutes ? `${wod.duration_minutes} min` : 'Variable'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>{wod.exercises.length} ejercicios</span>
              </div>
            </div>

            {/* Ejercicios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ejercicios</h3>
              {wod.exercises.map((exercise, index) => (
                <div key={index} className="p-4 rounded-xl border border-border/50 bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{exercise.name}</h4>
                      {exercise.weight && (
                        <p className="text-sm text-muted-foreground">Peso: {exercise.weight}</p>
                      )}
                      {exercise.reps && (
                        <p className="text-sm text-muted-foreground">Reps: {exercise.reps}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones */}
        {wod.instructions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Instrucciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{wod.instructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Escalado */}
        {wod.scaling && (
          <Card>
            <CardHeader>
              <CardTitle>Escalado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{wod.scaling}</p>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {wod.tips && wod.tips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Consejos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {wod.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}

