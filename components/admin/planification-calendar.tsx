'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar, Target, Plus } from 'lucide-react'
import { Planification } from '@/hooks/use-planifications'

interface PlanificationCalendarProps {
  planifications: Planification[]
  loading?: boolean
  onDateClick: (date: Date) => void
  onEditPlanification?: (planification: Planification) => void
  onDeletePlanification?: (planificationId: string) => void
  onViewDayPlanifications?: (date: Date, planifications: Planification[]) => void
}

export function PlanificationCalendar({ 
  planifications, 
  loading = false, 
  onDateClick,
  onEditPlanification,
  onDeletePlanification,
  onViewDayPlanifications
}: PlanificationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Obtener el primer día del mes y cuántos días tiene
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  // Ajustar para que lunes sea 0, domingo sea 6
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7
  
  // Días de la semana (lunes a domingo)
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  
  // Nombres de los meses
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  
  // Navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  // Verificar si un día tiene planificaciones
  const getPlanificationsForDay = (day: number) => {
    const date = new Date(year, month, day)
    const dateString = date.toISOString().split('T')[0]
    return planifications.filter(p => p.date === dateString)
  }
  
  // Verificar si es hoy
  const isToday = (day: number) => {
    const date = new Date(year, month, day)
    return date.toDateString() === today.toDateString()
  }
  
  // Verificar si es un día pasado
  const isPastDay = (day: number) => {
    const date = new Date(year, month, day)
    return date < today && !isToday(day)
  }
  
  // Manejar click en un día
  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day)
    const dayPlanifications = getPlanificationsForDay(day)
    
    if (dayPlanifications.length > 0) {
      // Si el día tiene planificaciones, mostrar modal de detalles
      onViewDayPlanifications?.(date, dayPlanifications)
    } else {
      // Si el día no tiene planificaciones, crear nueva
      onDateClick(date)
    }
  }
  
  // Generar array de días del mes
  const days = []
  
  // Días vacíos del mes anterior
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando calendario...</p>
      </div>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-lg">
      <CardHeader>
        <CardTitle className="text-center mb-2 flex items-center justify-center gap-2">
          <Calendar className="w-5 h-5" />
          Calendario de Planificaciones
        </CardTitle>
        
        {/* Navegación del mes */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="text-lg font-semibold">
            {monthNames[month]} {year}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-square"></div>
            }
            
            const dayPlanifications = getPlanificationsForDay(day)
            const isCurrentDay = isToday(day)
            const isPast = isPastDay(day)
            
            return (
              <div key={day} className="aspect-square">
                <Button
                  variant={isCurrentDay ? "default" : "outline"}
                  size="sm"
                  className={`
                    w-full h-full p-1 text-xs font-medium flex flex-col items-center justify-center
                    ${isCurrentDay 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : dayPlanifications.length > 0
                        ? 'border-primary/50 text-primary hover:bg-primary/10' 
                        : 'border-muted text-muted-foreground hover:bg-muted/50'
                    }
                    ${isPast ? 'opacity-60' : ''}
                  `}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="text-xs font-bold">{day}</span>
                  {dayPlanifications.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                      {dayPlanifications.slice(0, 2).map((planification, idx) => (
                        <div
                          key={planification.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: planification.discipline?.color || '#3B82F6' }}
                          title={planification.discipline?.name}
                        />
                      ))}
                      {dayPlanifications.length > 2 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
        
        {/* Leyenda */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Hoy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary/50"></div>
              <span>Con planificaciones</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-muted"></div>
              <span>Sin planificaciones</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
