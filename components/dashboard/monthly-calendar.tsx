"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, Target } from "lucide-react"
import Link from "next/link"

interface MonthlyCalendarProps {
  onDateClick?: (date: Date) => void
}

/**
 * Componente MonthlyCalendar - Calendario mensual para ver WODs
 * Permite navegar entre meses y hacer click en días para ver WODs
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
  
  // Verificar si un día tiene WOD (simulación - en una app real vendría de la API)
  const hasWOD = (day: number) => {
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    // Simular que hay WODs de lunes a viernes (1-5)
    return dayOfWeek >= 1 && dayOfWeek <= 5
  }
  
  // Verificar si es un día de entrenamiento (lunes a sábado)
  const isWorkoutDay = (day: number) => {
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    // Lunes a sábado (1-6), donde 0=domingo, 1=lunes, ..., 6=sábado
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
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-lg">
      <CardHeader>
        <CardTitle className="text-center mb-2">
        Calendario de Entrenamientos
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
            
             const hasWorkout = hasWOD(day)
             const isWorkoutDayValue = isWorkoutDay(day)
             const isCurrentDay = isToday(day)
             const isPast = isPastDay(day)
             
             return (
               <div key={day} className="aspect-square">
                 {hasWorkout ? (
                   <Link href={`/wod/${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`}>
                     <Button
                       variant={isCurrentDay ? "default" : "outline"}
                       size="sm"
                       className={`
                         w-full h-full p-0 text-xs font-medium
                         ${isCurrentDay 
                           ? 'bg-primary text-primary-foreground shadow-lg' 
                           : hasWorkout 
                             ? 'border-primary/50 text-primary hover:bg-primary/10' 
                             : 'border-muted text-muted-foreground'
                         }
                         ${isPast ? 'opacity-60' : ''}
                       `}
                       onClick={() => handleDayClick(day)}
                     >
                       <div className="flex flex-col items-center justify-center">
                         <span>{day}</span>
                         {hasWorkout}
                       </div>
                     </Button>
                   </Link>
                 ) : (
                   <div
                     className={`
                       w-full h-full flex items-center justify-center text-xs font-medium
                       ${isCurrentDay 
                         ? 'bg-primary/20 text-primary font-bold rounded-md' 
                         : isWorkoutDayValue
                           ? 'text-orange-500 font-semibold'
                           : 'text-muted-foreground'
                       }
                       ${isPast ? 'opacity-40' : ''}
                     `}
                   >
                     {day}
                   </div>
                 )}
               </div>
             )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
