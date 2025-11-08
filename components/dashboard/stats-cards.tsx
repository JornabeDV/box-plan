"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Clock, Calendar, Loader2, ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

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

/**
 * Componente StatsCards - Tarjetas de estadísticas del dashboard
 * Muestra la planificación de hoy según la disciplina y nivel del usuario
 */
export function StatsCards() {
  const router = useRouter()
  const { user } = useAuth()
  const [planification, setPlanification] = useState<Planification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTodayPlanification = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/planifications/today')
        
        if (!response.ok) {
          throw new Error('Error al cargar la planificación')
        }

        const data = await response.json()
        
        if (data.data) {
          setPlanification(data.data)
        } else {
          // No hay planificación para hoy
          setPlanification(null)
        }
      } catch (err) {
        console.error('Error fetching today planification:', err)
        setError('Error al cargar la planificación')
      } finally {
        setLoading(false)
      }
    }

    fetchTodayPlanification()
  }, [user?.id])

  // Formatear la duración estimada
  const formatDuration = (minutes?: number) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  // Obtener el nombre del primer bloque o un resumen
  const getSessionSummary = () => {
    if (!planification) return null
    
    if (planification.blocks && planification.blocks.length > 0) {
      return planification.blocks[0].title
    }
    
    if (planification.notes) {
      return planification.notes.substring(0, 50) + (planification.notes.length > 50 ? '...' : '')
    }
    
    return 'Entrenamiento programado'
  }

  if (loading) {
    return (
      <div className="mb-6">
        <Card className="border-secondary/30 bg-gradient-to-br from-card to-secondary/5 shadow-lg shadow-secondary/10">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center shadow-lg shadow-secondary/25 flex-shrink-0">
                <Loader2 className="w-6 h-6 text-secondary-foreground animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground font-medium">Cargando...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!planification) {
    return (
      <div className="mb-6">
        <Card className="border-secondary/30 bg-gradient-to-br from-card to-secondary/5 shadow-lg shadow-secondary/10">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center shadow-lg shadow-secondary/25 flex-shrink-0">
                <Calendar className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground font-medium">Planificación de hoy</p>
                <p className="font-bold text-base md:text-lg">No hay entrenamiento programado</p>
                <p className="text-xs text-muted-foreground mt-1 break-words">
                  {error || 'No hay planificación para tu disciplina y nivel hoy'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const duration = formatDuration(planification.estimated_duration)
  const summary = getSessionSummary()

  return (
    <div className="mb-6">
      <Card className="border-secondary/30 bg-gradient-to-br from-card to-secondary/5 shadow-lg shadow-secondary/10">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{
                  background: planification.discipline?.color 
                    ? `linear-gradient(to bottom right, ${planification.discipline.color}, ${planification.discipline.color}CC)`
                    : 'linear-gradient(to bottom right, hsl(var(--secondary)), hsl(var(--secondary))CC)'
                }}
              >
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground font-medium">Planificación de hoy</p>
                <p className="font-bold text-base md:text-lg break-words">
                  {planification.discipline?.name || 'Entrenamiento'}
                  {planification.discipline_level && (
                    <span className="block md:inline md:ml-1">
                      {planification.discipline_level.name}
                    </span>
                  )}
                </p>
                {summary && (
                  <p className="text-sm text-foreground mt-1 line-clamp-2">{summary}</p>
                )}
                {duration && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-secondary flex-shrink-0" />
                    <span className="text-xs text-secondary font-semibold">{duration}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/planification/today')}
              className="flex items-center justify-center gap-2 w-full md:w-auto md:flex-shrink-0"
            >
              Ver detalle
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}