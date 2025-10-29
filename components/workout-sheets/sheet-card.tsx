"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Play, 
  CheckCircle, 
  Clock, 
  Lock,
  Crown,
  Star,
  Zap
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface WorkoutSheet {
  id: string
  title: string
  description: string | null
  category_id: string
  plan_required: 'basic' | 'intermediate' | 'pro'
  template_data: any
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  workout_sheet_categories?: {
    id: string
    name: string
    description: string | null
    icon: string | null
    color: string
  }
}

interface UserWorkoutSheet {
  id: string
  user_id: string
  sheet_id: string
  data: any
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface SheetCardProps {
  sheet: WorkoutSheet
  userSheet?: UserWorkoutSheet
  userPlan: 'basic' | 'intermediate' | 'pro' | null
  onStart: (sheetId: string) => void
  onContinue: (userSheetId: string) => void
  onComplete: (userSheetId: string) => void
  loading?: boolean
}

const planIcons = {
  'basic': Zap,
  'intermediate': Star,
  'pro': Crown
}

const planColors = {
  'basic': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800'
  },
  'intermediate': {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800'
  },
  'pro': {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800'
  }
}

const planLabels = {
  'basic': 'Básico',
  'intermediate': 'Intermedio',
  'pro': 'Pro'
}

export function SheetCard({ 
  sheet, 
  userSheet, 
  userPlan, 
  onStart, 
  onContinue, 
  onComplete,
  loading = false 
}: SheetCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const PlanIcon = planIcons[sheet.plan_required]
  const colors = planColors[sheet.plan_required]
  const isAccessible = userPlan && (
    (sheet.plan_required === 'basic') ||
    (sheet.plan_required === 'intermediate' && (userPlan === 'intermediate' || userPlan === 'pro')) ||
    (sheet.plan_required === 'pro' && userPlan === 'pro')
  )

  const getStatus = () => {
    if (!userSheet) return 'not_started'
    if (userSheet.completed_at) return 'completed'
    return 'in_progress'
  }

  const status = getStatus()

  const getStatusInfo = () => {
    switch (status) {
      case 'not_started':
        return {
          icon: isAccessible ? Play : Lock,
          label: isAccessible ? 'Comenzar' : 'No disponible',
          color: isAccessible ? 'text-green-600' : 'text-muted-foreground',
          bg: isAccessible ? 'bg-green-50' : 'bg-muted/50'
        }
      case 'in_progress':
        return {
          icon: Clock,
          label: 'Continuar',
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        }
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completada',
          color: 'text-green-600',
          bg: 'bg-green-50'
        }
      default:
        return {
          icon: FileText,
          label: 'Ver',
          color: 'text-muted-foreground',
          bg: 'bg-muted/50'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  const handleAction = () => {
    if (!isAccessible) return
    
    if (status === 'not_started') {
      onStart(sheet.id)
    } else if (status === 'in_progress' && userSheet) {
      onContinue(userSheet.id)
    }
  }

  return (
    <Card 
      className={`relative transition-all duration-300 ${
        isAccessible ? 'hover:shadow-lg hover:scale-105' : 'opacity-60'
      } ${colors.border} ${colors.bg}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge de plan requerido */}
      <div className="absolute -top-2 -right-2">
        <Badge className={colors.badge}>
          <PlanIcon className="w-3 h-3 mr-1" />
          {planLabels[sheet.plan_required]}
        </Badge>
      </div>

      {/* Badge de estado */}
      {status !== 'not_started' && (
        <div className="absolute -top-2 -left-2">
          <Badge className={statusInfo.bg + ' ' + statusInfo.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className={`text-lg ${colors.text} flex items-center gap-2`}>
          <FileText className="w-5 h-5" />
          {sheet.title}
        </CardTitle>
        
        {sheet.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {sheet.description}
          </p>
        )}

        {/* Información de la categoría */}
        {sheet.workout_sheet_categories && (
          <div className="flex items-center gap-2 mt-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: sheet.workout_sheet_categories.color }}
            />
            <span className="text-xs text-muted-foreground">
              {sheet.workout_sheet_categories.name}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Información de progreso */}
          {userSheet && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Última actualización</span>
                <span>
                  {formatDistanceToNow(new Date(userSheet.updated_at), { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </span>
              </div>
              
              {status === 'completed' && userSheet.completed_at && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Completada</span>
                  <span>
                    {formatDistanceToNow(new Date(userSheet.completed_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Botón de acción */}
          <Button
            onClick={handleAction}
            disabled={!isAccessible || loading}
            className={`w-full ${
              isAccessible 
                ? status === 'completed' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-primary hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            size="sm"
          >
            {loading ? (
              <Clock className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <StatusIcon className="w-4 h-4 mr-2" />
            )}
            {statusInfo.label}
          </Button>

          {/* Mensaje de restricción */}
          {!isAccessible && (
            <p className="text-xs text-muted-foreground text-center">
              Requiere plan {planLabels[sheet.plan_required]} o superior
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}