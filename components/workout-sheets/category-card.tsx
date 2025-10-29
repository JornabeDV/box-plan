"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Target, 
  Trophy, 
  Zap, 
  Activity, 
  Heart,
  ArrowRight,
  FileText
} from "lucide-react"
import Link from "next/link"

interface WorkoutSheetCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CategoryCardProps {
  category: WorkoutSheetCategory
  sheetCount: number
  userSheetCount: number
  userPlan: 'basic' | 'intermediate' | 'pro' | null
  onViewSheets?: (categoryId: string) => void
}

const iconMap = {
  'Target': Target,
  'Trophy': Trophy,
  'Zap': Zap,
  'Activity': Activity,
  'Heart': Heart,
  'FileText': FileText
}

export function CategoryCard({ 
  category, 
  sheetCount, 
  userSheetCount, 
  userPlan,
  onViewSheets
}: CategoryCardProps) {
  const IconComponent = iconMap[category.icon as keyof typeof iconMap] || FileText
  
  const getPlanBadge = () => {
    if (!userPlan) return null
    
    const planColors = {
      'basic': 'bg-blue-100 text-blue-800',
      'intermediate': 'bg-purple-100 text-purple-800',
      'pro': 'bg-yellow-100 text-yellow-800'
    }
    
    const planLabels = {
      'basic': 'Plan Básico',
      'intermediate': 'Plan Intermedio',
      'pro': 'Plan Pro'
    }
    
    return (
      <Badge className={planColors[userPlan]}>
        {planLabels[userPlan]}
      </Badge>
    )
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <IconComponent 
              className="w-6 h-6" 
              style={{ color: category.color }}
            />
          </div>
          {getPlanBadge()}
        </div>
        
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {category.name}
        </CardTitle>
        
        {category.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {category.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Estadísticas */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {sheetCount} planilla{sheetCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">
                  {userSheetCount} completada{userSheetCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Progreso */}
          {sheetCount > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progreso</span>
                <span>{Math.round((userSheetCount / sheetCount) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: category.color,
                    width: `${Math.min((userSheetCount / sheetCount) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Botón de acción */}
          <Button 
            variant="outline" 
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            onClick={() => {
              if (onViewSheets) {
                onViewSheets(category.id)
              } else {
                alert(`Ver planillas de ${category.name}\n\nEsta funcionalidad estará disponible pronto.`)
              }
            }}
          >
            Ver Planillas
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}