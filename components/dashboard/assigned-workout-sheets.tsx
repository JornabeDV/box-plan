"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Clock, 
  Target, 
  CheckCircle, 
  Circle, 
  Calendar,
  User,
  Building
} from "lucide-react"
import { useUserWorkoutSheets } from "@/hooks/use-user-workout-sheets"
import { Database } from "@/lib/supabase"

type WorkoutSheetAssignment = Database['public']['Tables']['workout_sheet_assignments']['Row'] & {
  workout_sheet: Database['public']['Tables']['workout_sheets']['Row'] & {
    category: Database['public']['Tables']['workout_sheet_categories']['Row'] | null
  }
  admin: Database['public']['Tables']['admin_profiles']['Row']
}

interface AssignedWorkoutSheetsProps {
  userId: string
}

export function AssignedWorkoutSheets({ userId }: AssignedWorkoutSheetsProps) {
  const { assignedSheets, loading, error, markAsCompleted } = useUserWorkoutSheets(userId)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const handleMarkCompleted = async (assignmentId: string) => {
    setCompletingId(assignmentId)
    try {
      const result = await markAsCompleted(assignmentId)
      if (result.error) {
        console.error('Error marking as completed:', result.error)
        // Aquí podrías mostrar un toast de error
      }
    } finally {
      setCompletingId(null)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante'
      case 'intermediate': return 'Intermedio'
      case 'advanced': return 'Avanzado'
      default: return difficulty
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Planillas Asignadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Planillas Asignadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Error al cargar las planillas: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (assignedSheets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Planillas Asignadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No tienes planillas asignadas</p>
            <p className="text-sm">Tu entrenador te asignará planillas de entrenamiento aquí</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Planillas Asignadas ({assignedSheets.length})
        </CardTitle>
        <CardDescription>
          Planillas de entrenamiento asignadas por tu entrenador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignedSheets.map((assignment) => (
          <div
            key={assignment.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 hover:text-muted-foreground transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{assignment.workout_sheet.title}</h3>
                {assignment.workout_sheet.description && (
                  <p className="text-muted-foreground text-sm">
                    {assignment.workout_sheet.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {assignment.is_completed ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completada
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Circle className="w-3 h-3 mr-1" />
                    Pendiente
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {assignment.workout_sheet.category && (
                <Badge variant="outline">
                  {assignment.workout_sheet.category.name}
                </Badge>
              )}
              <Badge className={getDifficultyColor(assignment.workout_sheet.difficulty || 'beginner')}>
                {getDifficultyLabel(assignment.workout_sheet.difficulty || 'beginner')}
              </Badge>
              {assignment.workout_sheet.estimated_duration && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {assignment.workout_sheet.estimated_duration} min
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{assignment.admin.name}</span>
              </div>
              {assignment.admin.organization_name && (
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  <span>{assignment.admin.organization_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  Asignada: {new Date(assignment.assigned_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {assignment.due_date && (
              <div className="text-sm">
                <span className="text-muted-foreground">Fecha límite: </span>
                <span className={new Date(assignment.due_date) < new Date() ? 'text-red-600 font-medium' : ''}>
                  {new Date(assignment.due_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {assignment.admin_feedback && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 mb-1">Feedback del entrenador:</p>
                <p className="text-sm text-blue-800">{assignment.admin_feedback}</p>
              </div>
            )}

            {!assignment.is_completed && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleMarkCompleted(assignment.id)}
                  disabled={completingId === assignment.id}
                  className="flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  {completingId === assignment.id ? 'Marcando...' : 'Marcar como completada'}
                </Button>
              </div>
            )}

            {assignment.is_completed && assignment.completed_at && (
              <div className="text-sm text-muted-foreground">
                Completada el: {new Date(assignment.completed_at).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}