"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { useAuth } from "@/hooks/use-auth"
import { 
  Calendar, 
  Clock, 
  Target, 
  Dumbbell,
  FileText,
  CheckCircle,
  ArrowLeft,
  Loader2
} from "lucide-react"

interface Planification {
  id: string
  discipline_id: string
  discipline_level_id: string
  date: string
  estimated_duration?: number
  blocks: Array<{
    id: string
    title: string
    items: string[]
    order: number
    notes?: string
  }>
  notes?: string
  discipline?: {
    id: string
    name: string
    color: string
    icon: string
  }
  discipline_level?: {
    id: string
    name: string
    description?: string
  }
}

export default function TodayPlanificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [planification, setPlanification] = useState<Planification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    // Obtener la fecha de los query params o usar hoy
    const dateParam = searchParams.get('date')
    if (dateParam) {
      const parsedDate = new Date(dateParam + 'T00:00:00')
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate)
        // Resetear planificación cuando cambia la fecha
        setPlanification(null)
      }
    } else {
      // Si no hay fecha en los params, usar hoy
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      setSelectedDate(today)
      setPlanification(null)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchPlanification = async () => {
      if (!user?.id || !selectedDate) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Formatear la fecha como YYYY-MM-DD
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`

        const response = await fetch(`/api/planifications/today?date=${dateString}`)
        
        if (!response.ok) {
          throw new Error('Error al cargar la planificación')
        }

        const data = await response.json()
        
        if (data.data) {
          setPlanification(data.data)
        } else {
          setPlanification(null)
        }
      } catch (err) {
        console.error('Error fetching planification:', err)
        setError('Error al cargar la planificación')
        setPlanification(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPlanification()
  }, [user?.id, selectedDate])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes} minutos`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours} hora${hours > 1 ? 's' : ''}`
  }

  const sortedBlocks = planification ? [...(planification.blocks || [])].sort((a, b) => a.order - b.order) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-lime-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando planificación...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!planification) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="p-6 space-y-8 pb-32 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold">Planificación de Hoy</h1>
          </div>

          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay planificación para hoy</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'No hay planificación programada para tu disciplina y nivel hoy'}
              </p>
              <Button onClick={() => router.push('/')}>
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="p-6 space-y-6 pb-32 max-w-4xl mx-auto">
        {/* Header con botón volver */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">
            {selectedDate.toDateString() === new Date().toDateString() 
              ? 'Planificación de Hoy' 
              : `Planificación del ${formatDate(selectedDate.toISOString().split('T')[0] + 'T00:00:00')}`
            }
          </h1>
        </div>

        {/* Información principal */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                  style={{
                    background: planification.discipline?.color 
                      ? `linear-gradient(to bottom right, ${planification.discipline.color}, ${planification.discipline.color}CC)`
                      : 'linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary))CC)'
                  }}
                >
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {planification.discipline?.name || 'Entrenamiento'}
                  </h2>
                  {planification.discipline_level && (
                    <Badge 
                      variant="secondary" 
                      className="mt-2"
                      style={{
                        backgroundColor: planification.discipline?.color 
                          ? `${planification.discipline.color}20`
                          : undefined,
                        color: planification.discipline?.color || undefined
                      }}
                    >
                      {planification.discipline_level.name}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatDate(selectedDate.toISOString().split('T')[0] + 'T00:00:00')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {planification.estimated_duration && (
                <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duración estimada</p>
                    <p className="font-semibold">
                      {formatDuration(planification.estimated_duration)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                <Dumbbell className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Bloques de entrenamiento</p>
                  <p className="font-semibold">{sortedBlocks.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloques de entrenamiento */}
        {sortedBlocks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Bloques de Entrenamiento
            </h3>
            {sortedBlocks.map((block, index) => (
              <Card 
                key={block.id || index} 
                className="border-l-4 shadow-md"
                style={{
                  borderLeftColor: planification.discipline?.color || 'hsl(var(--primary))'
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <span 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{
                        backgroundColor: planification.discipline?.color || 'hsl(var(--primary))'
                      }}
                    >
                      {block.order || index + 1}
                    </span>
                    {block.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {block.items && block.items.length > 0 && (
                    <ul className="space-y-3 mb-4">
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <CheckCircle 
                            className="w-5 h-5 mt-0.5 flex-shrink-0"
                            style={{
                              color: planification.discipline?.color || 'hsl(var(--primary))'
                            }}
                          />
                          <span className="text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {(!block.items || block.items.length === 0) && (
                    <p className="text-sm text-muted-foreground mb-4">Sin ejercicios específicos</p>
                  )}
                  {block.notes && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Notas del bloque:</p>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap">
                        {block.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Notas adicionales */}
        {planification.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-wrap leading-relaxed">{planification.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Mensaje si no hay bloques ni notas */}
        {sortedBlocks.length === 0 && !planification.notes && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground">
                No hay detalles adicionales para esta planificación
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}