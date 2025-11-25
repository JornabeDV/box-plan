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
  
  // Normalizar fecha a formato YYYY-MM-DD sin considerar timezone
  const normalizeDate = (date: Date | string) => {
    if (typeof date === 'string') {
      // Si ya es string, tomar solo la parte de la fecha
      return date.split('T')[0]
    }
    // Crear fecha local sin timezone
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Verificar si un día tiene planificaciones
  const getPlanificationsForDay = (day: number) => {
    const date = new Date(year, month, day)
    const dateString = normalizeDate(date)
    return planifications.filter(p => {
      const planDate = normalizeDate(p.date)
      return planDate === dateString
    })
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
    <Card>
      <CardHeader className="pb-4">
        {/* Título y descripción */}
        <div className="text-center mb-4">
          <CardTitle className="text-xl font-heading text-foreground">
            Calendario de Planificaciones
          </CardTitle>
          <p className="text-sm text-muted-foreground">Seguimiento mensual</p>
        </div>
        
        {/* Navegación del mes */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="hover:bg-primary/10 hover:text-primary w-12 h-12 md:w-16 md:h-16"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          
          <h3 className="text-2xl font-heading font-bold text-foreground">
            {monthNames[month]} {year}
          </h3>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="hover:bg-primary/10 hover:text-primary w-12 h-12 md:w-16 md:h-16"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>
        
        {/* Botón Hoy */}
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-sm font-semibold hover:bg-primary/10 hover:text-primary"
          >
            Ir a Hoy
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm md:text-base font-bold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square"></div>
            }
            
            const dayPlanifications = getPlanificationsForDay(day)
            const isCurrentDay = isToday(day)
            const isPast = isPastDay(day)
            
            return (
              <div key={`day-${day}-${month}-${year}`} className="aspect-square">
                <div
                  className={`
                    w-full h-full flex flex-col items-center justify-center text-sm md:text-lg font-semibold rounded-xl cursor-pointer transition-all duration-200 relative
                    ${isCurrentDay 
                      ? 'bg-primary text-primary-foreground shadow-accent animate-pulse-glow' 
                      : dayPlanifications.length > 0
                        ? 'bg-lime-400/20 hover:bg-lime-400/30 hover:scale-105 border-2 border-lime-400/50' 
                        : 'hover:bg-muted/50'
                    }
                    ${isPast ? 'opacity-50' : ''}
                  `}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="text-sm md:text-lg font-bold">{day}</span>
                  {dayPlanifications.length > 0 && (
                    <span className="absolute top-1 right-1 bg-lime-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {dayPlanifications.length}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Leyenda */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-xs text-muted-foreground">Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-lime-400/20 border-2 border-lime-400/50 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Con planificaciones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted/50 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Sin planificaciones</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
