'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, Dumbbell } from 'lucide-react'
import { useCoachUserDisciplines } from '@/hooks/use-coach-user-disciplines'
import { useDisciplines } from '@/hooks/use-disciplines'

interface StudentDisciplinesManagerProps {
  studentId: string | null
  studentName: string
  coachId: string | null
}

export function StudentDisciplinesManager({ studentId, studentName, coachId }: StudentDisciplinesManagerProps) {
  const { disciplines: userDisciplines, loading, addDiscipline, removeDiscipline, hasDiscipline } = useCoachUserDisciplines(studentId)
  const { disciplines: availableDisciplines, disciplineLevels } = useDisciplines(coachId)
  
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('')
  const [selectedLevelId, setSelectedLevelId] = useState<string>('')
  const [adding, setAdding] = useState(false)

  // Filtrar disciplinas que el estudiante no tiene aún
  const disciplinesToAdd = availableDisciplines.filter(
    d => !hasDiscipline(parseInt(d.id))
  )

  // Obtener niveles disponibles para la disciplina seleccionada
  const availableLevels = selectedDisciplineId
    ? disciplineLevels.filter(level => level.discipline_id === selectedDisciplineId)
    : []

  const handleAddDiscipline = async () => {
    if (!selectedDisciplineId) return

    setAdding(true)
    const disciplineId = parseInt(selectedDisciplineId)
    const levelId = selectedLevelId ? parseInt(selectedLevelId) : null

    const result = await addDiscipline(disciplineId, levelId)

    if (!result.error) {
      setSelectedDisciplineId('')
      setSelectedLevelId('')
    }

    setAdding(false)
  }

  const handleRemoveDiscipline = async (userDisciplineId: number) => {
    await removeDiscipline(userDisciplineId)
  }

  if (!studentId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Selecciona un estudiante para gestionar sus disciplinas</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Dumbbell className="w-4 h-4" />
          Disciplinas de {studentName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Cargando...</span>
          </div>
        ) : (
          <>
            {/* Lista de disciplinas asignadas */}
            <div className="space-y-2">
              {userDisciplines.length > 0 ? (
                userDisciplines.map((userDiscipline) => (
                  <div
                    key={userDiscipline.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: userDiscipline.discipline?.color || '#3B82F6' }}
                      />
                      <div>
                        <span className="font-medium text-sm">{userDiscipline.discipline?.name}</span>
                        {userDiscipline.level && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {userDiscipline.level.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleRemoveDiscipline(userDiscipline.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No tiene disciplinas asignadas
                </p>
              )}
            </div>

            {/* Agregar nueva disciplina */}
            {disciplinesToAdd.length > 0 && (
              <div className="pt-3 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Agregar disciplina</p>
                <div className="flex gap-2">
                  <Select
                    value={selectedDisciplineId}
                    onValueChange={(value) => {
                      setSelectedDisciplineId(value)
                      setSelectedLevelId('')
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinesToAdd.map((discipline) => (
                        <SelectItem key={discipline.id} value={discipline.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: discipline.color }}
                            />
                            {discipline.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedLevelId}
                    onValueChange={setSelectedLevelId}
                    disabled={!selectedDisciplineId || availableLevels.length === 0}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Nivel (opc)" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon"
                    onClick={handleAddDiscipline}
                    disabled={!selectedDisciplineId || adding}
                  >
                    {adding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
