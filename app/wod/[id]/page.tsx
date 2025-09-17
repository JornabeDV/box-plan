"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Zap, 
  Clock, 
  Target, 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Trophy,
  Timer,
  CheckCircle
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import Link from "next/link"

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
}

export default function WODDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [wod, setWod] = useState<WOD | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [completedExercises, setCompletedExercises] = useState<boolean[]>([])

  const handleGoBack = () => {
    router.push('/')
  }

  // Datos de ejemplo - en una app real vendrían de la API
  useEffect(() => {
    const mockWOD: WOD = {
      id: params.id as string,
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
      ]
    }
    
    setWod(mockWOD)
    setCompletedExercises(new Array(mockWOD.exercises.length).fill(false))
    setLoading(false)
  }, [params.id])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning])

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTime(0)
    setCurrentExercise(0)
    setCompletedExercises(new Array(wod?.exercises.length || 0).fill(false))
  }

  const toggleExerciseComplete = (index: number) => {
    const newCompleted = [...completedExercises]
    newCompleted[index] = !newCompleted[index]
    setCompletedExercises(newCompleted)
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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

  if (!wod) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
        <Header />
        <main className="p-6 pb-24">
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">WOD no encontrado</h2>
            <p className="text-muted-foreground mb-6">El entrenamiento que buscas no existe</p>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
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
            <p className="text-muted-foreground">Detalle completo del entrenamiento</p>
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
                <Clock className="w-4 h-4" />
                <span>Tiempo objetivo: {wod.duration_minutes ? `${wod.duration_minutes} min` : 'Variable'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>{wod.exercises.length} ejercicios</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="w-4 h-4" />
                <span>Dificultad: {getDifficultyText(wod.difficulty)}</span>
              </div>
            </div>

            {/* Timer */}
            <div className="bg-gradient-to-r from-accent/10 to-transparent p-4 rounded-xl border border-accent/20 mb-6">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-accent mb-2">
                  {formatTime(time)}
                </div>
                <div className="flex justify-center gap-3">
                  {!isRunning ? (
                    <Button onClick={handleStart} className="bg-primary hover:bg-primary/90">
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar
                    </Button>
                  ) : (
                    <Button onClick={handlePause} variant="outline">
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar
                    </Button>
                  )}
                  <Button onClick={handleReset} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Ejercicios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ejercicios</h3>
              {wod.exercises.map((exercise, index) => (
                <div key={index} className={`p-4 rounded-xl border transition-colors ${
                  completedExercises[index] 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-card/50 border-border/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        completedExercises[index] 
                          ? 'bg-green-500 text-white' 
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        {completedExercises[index] ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
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
                    <Button
                      size="sm"
                      variant={completedExercises[index] ? "outline" : "default"}
                      onClick={() => toggleExerciseComplete(index)}
                    >
                      {completedExercises[index] ? 'Completado' : 'Marcar'}
                    </Button>
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
                <Timer className="w-5 h-5" />
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
