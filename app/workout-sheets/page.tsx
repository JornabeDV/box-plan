"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryCard } from "@/components/workout-sheets/category-card"
import { SheetCard } from "@/components/workout-sheets/sheet-card"
import { useWorkoutSheets } from "@/hooks/use-workout-sheets"
import { useProfile } from "@/hooks/use-profile"
import { 
  ArrowLeft, 
  FileText, 
  Target, 
  Plus,
  Filter,
  Search
} from "lucide-react"
import { Loader2 } from "lucide-react"

export default function WorkoutSheetsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("categories")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const { 
    categories, 
    sheets, 
    userSheets, 
    loading, 
    error,
    createUserSheet,
    getSheetsByPlan
  } = useWorkoutSheets()
  
  const { subscription } = useProfile()

  // Obtener plan del usuario
  const userPlan = subscription?.subscription_plans?.name?.toLowerCase() as 'basic' | 'intermediate' | 'pro' | null

  // Filtrar planillas por plan
  const availableSheets = getSheetsByPlan(userPlan)

  // Agrupar planillas por categoría
  const sheetsByCategory = categories.map(category => {
    const categorySheets = availableSheets.filter(sheet => sheet.category_id === category.id)
    const userCategorySheets = userSheets.filter(userSheet => 
      categorySheets.some(sheet => sheet.id === userSheet.sheet_id)
    )
    
    return {
      category,
      sheets: categorySheets,
      userSheets: userCategorySheets
    }
  })

  const handleStartSheet = async (sheetId: string) => {
    try {
      await createUserSheet(sheetId, {})
    } catch (error) {
      console.error('Error starting sheet:', error)
    }
  }

  const handleContinueSheet = (userSheetId: string) => {
    // TODO: Implementar navegación a la planilla específica
    console.log('Continue sheet:', userSheetId)
  }

  const handleCompleteSheet = (userSheetId: string) => {
    // TODO: Implementar completar planilla
    console.log('Complete sheet:', userSheetId)
  }

  const handleViewSheets = (categoryId: string) => {
    setActiveTab("all-sheets")
    setSelectedCategory(categoryId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando planillas de entrenamiento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      {/* Header */}
      <div className="border-b border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Planillas de Entrenamiento</h1>
              <p className="text-muted-foreground">
                Organiza y registra tu progreso con nuestras planillas especializadas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Categorías
            </TabsTrigger>
            <TabsTrigger value="all-sheets" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Todas las Planillas
            </TabsTrigger>
          </TabsList>

          {/* Vista por Categorías */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sheetsByCategory.map(({ category, sheets, userSheets }) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  sheetCount={sheets.length}
                  userSheetCount={userSheets.length}
                  userPlan={userPlan}
                  onViewSheets={handleViewSheets}
                />
              ))}
            </div>
          </TabsContent>

          {/* Vista de Todas las Planillas */}
          <TabsContent value="all-sheets" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Todas
                  </Button>
                  {categories.map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Planillas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableSheets
                .filter(sheet => !selectedCategory || sheet.category_id === selectedCategory)
                .map(sheet => {
                  const userSheet = userSheets.find(us => us.sheet_id === sheet.id)
                  return (
                    <SheetCard
                      key={sheet.id}
                      sheet={sheet}
                      userSheet={userSheet}
                      userPlan={userPlan}
                      onStart={handleStartSheet}
                      onContinue={handleContinueSheet}
                      onComplete={handleCompleteSheet}
                    />
                  )
                })}
            </div>

            {availableSheets.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay planillas disponibles</h3>
                    <p className="text-muted-foreground">
                      {!userPlan 
                        ? "Inicia sesión para ver las planillas disponibles"
                        : "No hay planillas disponibles para tu plan actual"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Información del Plan */}
        {userPlan && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Tu Plan Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Plan {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tienes acceso a {availableSheets.length} planilla{availableSheets.length !== 1 ? 's' : ''} de entrenamiento
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/subscription')}
                >
                  Gestionar Suscripción
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
