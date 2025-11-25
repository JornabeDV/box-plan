"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { useAuth } from "@/hooks/use-auth"
import { 
  Calendar, 
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
      // Parsear la fecha manualmente para evitar problemas de zona horaria
      const [year, month, day] = dateParam.split('-').map(Number)
      const parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0)
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

        // Formatear la fecha como YYYY-MM-DD (usar métodos locales para evitar problemas de zona horaria)
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`

        console.log('Fetching planification for date:', dateString) // Debug

        const response = await fetch(`/api/planifications/today?date=${dateString}`)
        
        if (!response.ok) {
          throw new Error('Error al cargar la planificación')
        }

        const data = await response.json()
        
        console.log('Planification data:', data) // Debug
        
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
  }, [user?.id, selectedDate?.getTime()]) // Usar getTime() para comparar fechas correctamente

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Función helper para comparar fechas (solo año, mes y día)
  const isSameDate = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
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
          <div className="flex flex-col items-start gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isSameDate(selectedDate, new Date())
                  ? 'Planificación de Hoy' 
                  : 'Planificación'
                }
              </h1>
              {!isSameDate(selectedDate, new Date()) && (
                <p className="text-sm md:text-base text-zinc-400 font-medium mt-1">
                  {formatDate(selectedDate.toISOString().split('T')[0] + 'T00:00:00')}
                </p>
              )}
            </div>
          </div>

          <Card className="bg-[#141414c7] border-zinc-800/50 shadow-2xl" style={{ boxShadow: '0 40px 80px -12px rgba(204, 255, 0, 0.3), 0 20px 40px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.15)' }}>
            <CardContent className="pt-6 text-center py-12">
              <Calendar className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">
                {isSameDate(selectedDate, new Date())
                  ? 'No hay planificación para hoy'
                  : `No hay planificación para el ${formatDate(selectedDate.toISOString().split('T')[0] + 'T00:00:00')}`
                }
              </h3>
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
        <div className="mb-6 flex flex-col items-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isSameDate(selectedDate, new Date())
                ? 'Planificación de Hoy' 
                : 'Planificación'
              }
            </h1>
            {!isSameDate(selectedDate, new Date()) && (
              <p className="text-sm md:text-base text-zinc-400 font-medium mt-1">
                {formatDate(selectedDate.toISOString().split('T')[0] + 'T00:00:00')}
              </p>
            )}
          </div>
        </div>

        {/* Bloques de entrenamiento */}
        {sortedBlocks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
              <FileText className="w-6 h-6 text-lime-400" />
              Bloques de Entrenamiento
            </h3>
            {sortedBlocks.map((block, index) => (
              <Card key={block.id || index} >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg text-white">
                    <span 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md"
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
                          <span className="text-base text-zinc-100">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {(!block.items || block.items.length === 0) && (
                    <p className="text-sm text-zinc-400 mb-4">Sin ejercicios específicos</p>
                  )}
                  {block.notes && (
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                      <p className="text-xs font-medium text-zinc-400 mb-2">Notas del bloque:</p>
                      <p className="text-sm text-zinc-200 bg-zinc-950/60 p-3 rounded-md whitespace-pre-wrap border border-zinc-800/40">
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
              <CardTitle className="text-xl flex items-center gap-2 text-white">
                <FileText className="w-6 h-6 text-lime-400" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-zinc-100 whitespace-pre-wrap leading-relaxed">{planification.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Mensaje si no hay bloques ni notas */}
        {sortedBlocks.length === 0 && !planification.notes && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-zinc-300">
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