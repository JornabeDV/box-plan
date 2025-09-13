"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ForumCategory } from "@/hooks/use-forum"
import { 
  Zap, 
  Apple, 
  Dumbbell, 
  MessageCircle, 
  Trophy,
  ChevronRight
} from "lucide-react"

interface ForumCategoriesProps {
  categories: ForumCategory[]
  selectedCategory?: string
  onCategorySelect: (categoryId: string) => void
  onShowAll: () => void
}

const categoryIcons = {
  Zap,
  Apple,
  Dumbbell,
  MessageCircle,
  Trophy
}

export function ForumCategories({ 
  categories, 
  selectedCategory, 
  onCategorySelect, 
  onShowAll 
}: ForumCategoriesProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const getIcon = (iconName: string) => {
    const IconComponent = categoryIcons[iconName as keyof typeof categoryIcons] || MessageCircle
    return <IconComponent className="h-5 w-5" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Categorías</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onShowAll}
          className={!selectedCategory ? "bg-primary text-primary-foreground" : ""}
        >
          Todas
        </Button>
      </div>

      <div className="grid gap-3">
        {categories.map((category) => (
          <Card
            key={category.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCategory === category.id
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onMouseEnter={() => setHoveredCategory(category.id)}
            onMouseLeave={() => setHoveredCategory(null)}
            onClick={() => onCategorySelect(category.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <div 
                      className="text-foreground"
                      style={{ color: category.color }}
                    >
                      {getIcon(category.icon)}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {category.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary"
                    className="text-xs"
                  >
                    {category.order_index}
                  </Badge>
                  <ChevronRight 
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      hoveredCategory === category.id ? "translate-x-1" : ""
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}