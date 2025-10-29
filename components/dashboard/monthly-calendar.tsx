"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Target } from "lucide-react"
import Link from "next/link"

interface MonthlyCalendarProps {
  onDateClick?: (date: Date) => void
}

/**
 * Componente MonthlyCalendar - Calendario mensual para ver entrenamientos
 * Permite navegar entre meses y hacer click en días para ver entrenamientos
 */
export function MonthlyCalendar({ onDateClick }: MonthlyCalendarProps) {
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
  
  // Verificar si un día tiene entrenamiento (simulación - en una app real vendría de la API)
  const hasWorkout = (day: number) => {
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    // Simular que hay entrenamientos de lunes a sábado (1-6)
    // donde 0=domingo, 1=lunes, ..., 6=sábado
    return dayOfWeek >= 1 && dayOfWeek <= 6
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
    if (onDateClick) {
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
  
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-2 border-border shadow-soft">
      <CardHeader className="pb-4">
        {/* Título y descripción */}
        <div className="text-center mb-4">
          <CardTitle className="text-xl font-heading text-foreground">
            Calendario de Entrenamientos
          </CardTitle>
          <p className="text-sm text-muted-foreground">Seguimiento mensual</p>
        </div>
        
        {/* Navegación del mes */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goToPreviousMonth}
            className="hover:bg-primary/10 hover:text-primary"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="text-2xl font-heading font-bold text-foreground">
            {monthNames[month]} {year}
          </h3>
          
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goToNextMonth}
            className="hover:bg-primary/10 hover:text-primary"
          >
            <ChevronRight className="w-4 h-4" />
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
            <div key={day} className="text-center text-sm font-bold text-muted-foreground py-2">
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
            
            const hasWorkoutValue = hasWorkout(day)
            const isCurrentDay = isToday(day)
            const isPast = isPastDay(day)
            
            return (
              <div key={`day-${day}-${month}-${year}`} className="aspect-square">
                <div
                  className={`
                    w-full h-full flex items-center justify-center text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200
                    ${isCurrentDay 
                      ? 'bg-primary text-primary-foreground shadow-accent animate-pulse-glow' 
                      : hasWorkoutValue 
                        ? 'bg-accent/20 text-accent hover:bg-accent/30 hover:scale-105 border-2 border-accent/30' 
                        : 'text-muted-foreground hover:bg-muted/50'
                    }
                    ${isPast ? 'opacity-50' : ''}
                  `}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="text-sm">{day}</span>
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
            <div className="w-3 h-3 bg-accent/20 border-2 border-accent/30 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Días de entrenamiento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted/50 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Día libre</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
