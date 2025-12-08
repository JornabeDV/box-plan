"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Clock, Calendar, ArrowRight } from "lucide-react"
import { useTodayPlanification } from "@/hooks/use-today-planification"

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
  const { planification, loading, error } = useTodayPlanification()
  
  // Adaptar la estructura de datos si es necesario
  const adaptedPlanification = planification ? {
    id: planification.id,
    discipline_id: String(planification.disciplineId),
    discipline_level_id: String(planification.disciplineLevelId),
    date: planification.date,
    estimated_duration: planification.estimatedDuration,
    blocks: planification.blocks?.map((block, index) => ({
      id: block.id,
      title: block.name,
      items: block.description ? [block.description] : [],
      order: index
    })) || [],
    notes: planification.description,
    discipline: planification.discipline ? {
      id: planification.discipline.id,
      name: planification.discipline.name,
      color: planification.discipline.color,
      icon: ''
    } : undefined,
    discipline_level: planification.disciplineLevel ? {
      id: planification.disciplineLevel.id,
      name: planification.disciplineLevel.name,
      description: planification.disciplineLevel.description
    } : undefined
  } : null

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
    if (!adaptedPlanification) return null
    
    if (adaptedPlanification.blocks && adaptedPlanification.blocks.length > 0) {
      return adaptedPlanification.blocks[0].title
    }
    
    if (adaptedPlanification.notes) {
      return adaptedPlanification.notes.substring(0, 50) + (adaptedPlanification.notes.length > 50 ? '...' : '')
    }
    
    return 'Entrenamiento programado'
  }

  if (!adaptedPlanification) {
    return (
      <div className="mb-6">
        <Card>
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center shadow-lg shadow-secondary/25 flex-shrink-0">
                <Calendar className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground font-medium">Planificación de hoy</p>
                <p className="font-bold text-base md:text-lg">No hay entrenamiento programado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const duration = formatDuration(adaptedPlanification.estimated_duration)
  const summary = getSessionSummary()

  return (
    <div className="mb-6">
      <Card>
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{
                  background: adaptedPlanification.discipline?.color 
                    ? `linear-gradient(to bottom right, ${adaptedPlanification.discipline.color}, ${adaptedPlanification.discipline.color}CC)`
                    : 'linear-gradient(to bottom right, hsl(var(--secondary)), hsl(var(--secondary))CC)'
                }}
              >
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground font-medium">Planificación de hoy</p>
                <p className="font-bold text-base md:text-lg break-words">
                  {adaptedPlanification.discipline?.name || 'Entrenamiento'}
                  {adaptedPlanification.discipline_level && (
                    <span className="block md:inline md:ml-1">
                      {adaptedPlanification.discipline_level.name}
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
              onClick={() => {
                // Formatear la fecha de hoy como YYYY-MM-DD
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const year = today.getFullYear()
                const month = String(today.getMonth() + 1).padStart(2, '0')
                const day = String(today.getDate()).padStart(2, '0')
                const dateString = `${year}-${month}-${day}`
                
                router.push(`/planification?date=${dateString}`)
              }}
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