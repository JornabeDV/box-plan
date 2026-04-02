'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dumbbell } from 'lucide-react'
import { useUserDisciplines } from '@/hooks/use-user-disciplines'
import { useRouter, useSearchParams } from 'next/navigation'

interface DisciplineOption {
  id: number
  name: string
  color: string
  levelId: number | null
  levelName: string | null
}

interface DisciplineSelectorProps {
  selectedDisciplineId: number | null
  onDisciplineChange: (disciplineId: number | null) => void
  disabled?: boolean
  availableDisciplineOptions?: DisciplineOption[]
}

export function DisciplineSelector({
  selectedDisciplineId,
  onDisciplineChange,
  disabled = false,
  availableDisciplineOptions
}: DisciplineSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleDisciplineChange = (value: string) => {
    const disciplineId = value === 'all' ? null : parseInt(value, 10)
    onDisciplineChange(disciplineId)

    // Actualizar URL para mantener el estado
    const params = new URLSearchParams(searchParams.toString())
    if (disciplineId) {
      params.set('disciplineId', disciplineId.toString())
    } else {
      params.delete('disciplineId')
    }

    // Mantener la fecha si existe
    const currentUrl = window.location.pathname
    const newUrl = params.toString() ? `${currentUrl}?${params.toString()}` : currentUrl
    router.replace(newUrl, { scroll: false })
  }

  // Determinar la disciplina seleccionada basada en la URL o la primera disponible
  const currentSelectedId = selectedDisciplineId ||
    (searchParams.get('disciplineId') ? parseInt(searchParams.get('disciplineId')!, 10) : null)

  // No mostrar selector si no hay opciones disponibles
  if (!availableDisciplineOptions || availableDisciplineOptions.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Dumbbell className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Disciplina:</span>
      </div>

      <Select
        value={currentSelectedId?.toString() || 'all'}
        onValueChange={handleDisciplineChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar disciplina" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las disciplinas</SelectItem>
          {availableDisciplineOptions.map((option) => (
            <SelectItem
              key={option.id}
              value={option.id.toString()}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                <span>{option.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
