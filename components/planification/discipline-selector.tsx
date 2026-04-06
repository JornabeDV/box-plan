'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dumbbell } from 'lucide-react'

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
  const handleDisciplineChange = (value: string) => {
    const disciplineId = value === 'all' ? null : parseInt(value, 10)
    onDisciplineChange(disciplineId)
  }

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
        value={selectedDisciplineId?.toString() || 'all'}
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
