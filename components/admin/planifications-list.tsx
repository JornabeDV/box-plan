'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Target, 
  Clock, 
  FileText, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  Filter,
  Plus
} from 'lucide-react'
import { Planification } from '@/hooks/use-planifications'

interface PlanificationsListProps {
  planifications: Planification[]
  loading?: boolean
  onEdit?: (planification: Planification) => void
  onDelete?: (planificationId: string) => void
  onView?: (planification: Planification) => void
}

export function PlanificationsList({ 
  planifications, 
  loading = false, 
  onEdit, 
  onDelete, 
  onView 
}: PlanificationsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all')

  // Filtrar planificaciones según búsqueda y disciplina
  const filteredPlanifications = planifications.filter(planification => {
    const matchesSearch = searchQuery === '' || 
      planification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      planification.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      planification.discipline?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDiscipline = selectedDiscipline === 'all' || planification.discipline_id === selectedDiscipline
    
    return matchesSearch && matchesDiscipline
  })

  // Obtener disciplinas únicas para el filtro
  const uniqueDisciplines = planifications.reduce((acc, planification) => {
    if (planification.discipline && !acc.find(d => d.id === planification.discipline_id)) {
      acc.push({
        id: planification.discipline_id,
        name: planification.discipline.name,
        color: planification.discipline.color
      })
    }
    return acc
  }, [] as Array<{ id: string; name: string; color: string }>)

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando planificaciones...</p>
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
            placeholder="Buscar planificaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedDiscipline}
          onChange={(e) => setSelectedDiscipline(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="all">Todas las disciplinas</option>
          {uniqueDisciplines.map((discipline) => (
            <option key={discipline.id} value={discipline.id}>
              {discipline.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de planificaciones */}
      {filteredPlanifications.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay planificaciones</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'No se encontraron planificaciones con ese criterio.' : 'Crea tu primera planificación.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlanifications.map((planification) => (
            <Card key={planification.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      {planification.title}
                    </CardTitle>
                    {planification.description && (
                      <p className="text-sm text-muted-foreground">{planification.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1"
                      style={{ borderColor: planification.discipline?.color, color: planification.discipline?.color }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: planification.discipline?.color }}
                      />
                      {planification.discipline?.name}
                    </Badge>
                    <Badge variant="secondary">
                      {planification.discipline_level?.name}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Información de la planificación */}
                  <div className="space-y-2">
                    {planification.estimated_duration && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{planification.estimated_duration} min</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>{planification.blocks.length} bloques</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(planification.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Bloques de contenido (primeros 2) */}
                  {planification.blocks.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Bloques:</h4>
                      {planification.blocks.slice(0, 2).map((block, index) => (
                        <div key={block.id} className="text-xs text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span className="truncate">{block.content}</span>
                        </div>
                      ))}
                      {planification.blocks.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{planification.blocks.length - 2} bloques más
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notas (si existen) */}
                  {planification.notes && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Notas:</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {planification.notes}
                      </p>
                    </div>
                  )}

                  {/* Tags de configuración */}
                  <div className="flex flex-wrap gap-1">
                    {planification.is_active && (
                      <Badge variant="outline" className="text-xs">
                        Activa
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
                      onClick={() => onView?.(planification)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onEdit?.(planification)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete?.(planification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(planification.created_at).toLocaleDateString()}
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
