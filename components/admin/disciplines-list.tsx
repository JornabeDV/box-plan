'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Target,
  GripVertical,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Discipline, DisciplineLevel } from '@/hooks/use-disciplines'

interface DisciplinesListProps {
  disciplines: Discipline[]
  loading?: boolean
  onEdit: (discipline: Discipline) => void
  onDelete: (disciplineId: string) => void
  onReorder: (disciplineIds: string[]) => void
  onReorderLevels: (disciplineId: string, levelIds: string[]) => void
}

export function DisciplinesList({ 
  disciplines, 
  loading = false, 
  onEdit, 
  onDelete,
  onReorder,
  onReorderLevels
}: DisciplinesListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDisciplines, setExpandedDisciplines] = useState<Set<string>>(new Set())
  const [draggedDiscipline, setDraggedDiscipline] = useState<string | null>(null)
  const [draggedLevel, setDraggedLevel] = useState<{ disciplineId: string; levelId: string } | null>(null)

  // Filtrar disciplinas según búsqueda
  const filteredDisciplines = disciplines.filter(discipline => 
    discipline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discipline.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discipline.levels?.some(level => 
      level.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const toggleDiscipline = (disciplineId: string) => {
    setExpandedDisciplines(prev => {
      const newSet = new Set(prev)
      if (newSet.has(disciplineId)) {
        newSet.delete(disciplineId)
      } else {
        newSet.add(disciplineId)
      }
      return newSet
    })
  }

  const handleDragStart = (e: React.DragEvent, disciplineId: string) => {
    setDraggedDiscipline(disciplineId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetDisciplineId: string) => {
    e.preventDefault()
    
    if (draggedDiscipline && draggedDiscipline !== targetDisciplineId) {
      const newOrder = disciplines.map(d => d.id)
      const draggedIndex = newOrder.indexOf(draggedDiscipline)
      const targetIndex = newOrder.indexOf(targetDisciplineId)
      
      // Mover elemento
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedDiscipline)
      
      onReorder(newOrder)
    }
    
    setDraggedDiscipline(null)
  }

  const handleLevelDragStart = (e: React.DragEvent, disciplineId: string, levelId: string) => {
    setDraggedLevel({ disciplineId, levelId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleLevelDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleLevelDrop = (e: React.DragEvent, targetDisciplineId: string, targetLevelId: string) => {
    e.preventDefault()
    
    if (draggedLevel && 
        draggedLevel.disciplineId === targetDisciplineId && 
        draggedLevel.levelId !== targetLevelId) {
      
      const discipline = disciplines.find(d => d.id === targetDisciplineId)
      if (discipline?.levels) {
        const newOrder = discipline.levels.map(l => l.id)
        const draggedIndex = newOrder.indexOf(draggedLevel.levelId)
        const targetIndex = newOrder.indexOf(targetLevelId)
        
        // Mover elemento
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedLevel.levelId)
        
        onReorderLevels(targetDisciplineId, newOrder)
      }
    }
    
    setDraggedLevel(null)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando disciplinas...</p>
      </div>
    )
  }

  if (disciplines.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay disciplinas</h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery ? 'No se encontraron disciplinas con ese criterio.' : 'Crea tu primera disciplina.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar disciplinas o niveles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de disciplinas */}
      <div className="space-y-3">
        {filteredDisciplines.map((discipline) => (
          <Card 
            key={discipline.id} 
            className="hover:shadow-lg transition-shadow"
            draggable
            onDragStart={(e) => handleDragStart(e, discipline.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, discipline.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: discipline.color }}
                  />
                  <div>
                    <CardTitle className="text-lg">
                      {discipline.name}
                    </CardTitle>
                    {discipline.description && (
                      <CardDescription className="mt-1">
                        {discipline.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {discipline.levels?.length || 0} niveles
                  </Badge>
                  
                  {discipline.levels && discipline.levels.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDiscipline(discipline.id)}
                    >
                      {expandedDisciplines.has(discipline.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(discipline)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(discipline.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Eliminar disciplina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Niveles expandidos */}
            {expandedDisciplines.has(discipline.id) && discipline.levels && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Niveles:</h4>
                  {discipline.levels.map((level, index) => (
                    <div
                      key={level.id}
                      className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                      draggable
                      onDragStart={(e) => handleLevelDragStart(e, discipline.id, level.id)}
                      onDragOver={handleLevelDragOver}
                      onDrop={(e) => handleLevelDrop(e, discipline.id, level.id)}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{level.name}</div>
                        {level.description && (
                          <div className="text-sm text-muted-foreground">{level.description}</div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
