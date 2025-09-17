'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Zap, 
  Clock, 
  Target, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  Dumbbell
} from 'lucide-react'

interface WOD {
  id: string
  name: string
  description: string
  type: 'metcon' | 'strength' | 'skill' | 'endurance'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes?: number
  exercises: Array<{
    name: string
    weight?: string
    reps?: string
    sets?: string
    notes?: string
  }>
  instructions?: string
  scaling?: string
  tips?: string[]
  is_public: boolean
  is_template: boolean
  date?: string
  admin_id: string
  created_at: string
  updated_at: string
}

interface WODsListProps {
  wods: WOD[]
  loading?: boolean
  onEdit?: (wod: WOD) => void
  onDelete?: (wodId: string) => void
  onView?: (wod: WOD) => void
}

export function WODsList({ 
  wods, 
  loading = false, 
  onEdit, 
  onDelete, 
  onView 
}: WODsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  // Filtrar WODs según búsqueda, tipo y dificultad
  const filteredWODs = wods.filter(wod => {
    const matchesSearch = searchQuery === '' || 
      wod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wod.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === 'all' || wod.type === selectedType
    const matchesDifficulty = selectedDifficulty === 'all' || wod.difficulty === selectedDifficulty
    
    return matchesSearch && matchesType && matchesDifficulty
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500'
      case 'intermediate': return 'bg-yellow-500'
      case 'advanced': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante'
      case 'intermediate': return 'Intermedio'
      case 'advanced': return 'Avanzado'
      default: return 'N/A'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'metcon': return 'MetCon'
      case 'strength': return 'Fuerza'
      case 'skill': return 'Habilidad'
      case 'endurance': return 'Resistencia'
      default: return 'N/A'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando WODs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar WODs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="all">Todos los tipos</option>
          <option value="metcon">MetCon</option>
          <option value="strength">Fuerza</option>
          <option value="skill">Habilidad</option>
          <option value="endurance">Resistencia</option>
        </select>
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="all">Todas las dificultades</option>
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>
      </div>

      {/* Lista de WODs */}
      {filteredWODs.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay WODs</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'No se encontraron WODs con ese criterio.' : 'Crea tu primer WOD.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWODs.map((wod) => (
            <Card key={wod.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      {wod.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{wod.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={`${getDifficultyColor(wod.difficulty)} text-white`}>
                      {getDifficultyText(wod.difficulty)}
                    </Badge>
                    <Badge variant="outline">
                      {getTypeText(wod.type)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Información del WOD */}
                  <div className="space-y-2">
                    {wod.duration_minutes && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{wod.duration_minutes} min</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Dumbbell className="h-4 w-4 mr-2" />
                      <span>{wod.exercises.length} ejercicios</span>
                    </div>
                    {wod.date && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(wod.date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Lista de ejercicios (primeros 3) */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Ejercicios:</h4>
                    {wod.exercises.slice(0, 3).map((exercise, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span>{exercise.name}</span>
                        {exercise.weight && <span>({exercise.weight})</span>}
                      </div>
                    ))}
                    {wod.exercises.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{wod.exercises.length - 3} ejercicios más
                      </div>
                    )}
                  </div>

                  {/* Tags de configuración */}
                  <div className="flex flex-wrap gap-1">
                    {wod.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Público
                      </Badge>
                    )}
                    {wod.is_template && (
                      <Badge variant="outline" className="text-xs">
                        Plantilla
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onView?.(wod)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onEdit?.(wod)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete?.(wod.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(wod.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

