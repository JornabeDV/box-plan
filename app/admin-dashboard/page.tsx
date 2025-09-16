'use client'

import { useState } from 'react'
import { useSimplifiedAuth } from '@/hooks/use-simplified-auth'
import { useAdminWorkoutSheets } from '@/hooks/use-admin-workout-sheets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Clock,
  Dumbbell,
  Star,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { CreateWorkoutSheetModal } from '@/components/admin/create-workout-sheet-modal'
import { AdminStats } from '@/components/admin/admin-stats'
import { UsersList } from '@/components/admin/users-list'

export default function AdminDashboardPage() {
  const { user, adminProfile, loading: authLoading, isAdmin } = useSimplifiedAuth()
  const { 
    workoutSheets, 
    categories, 
    loading: sheetsLoading, 
    createWorkoutSheet,
    searchWorkoutSheets 
  } = useAdminWorkoutSheets(adminProfile?.id)

  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  // Filtrar planillas según búsqueda y dificultad
  const filteredSheets = workoutSheets.filter(sheet => {
    const matchesSearch = searchQuery === '' || 
      sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sheet.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sheet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesDifficulty = selectedDifficulty === 'all' || sheet.difficulty === selectedDifficulty
    
    return matchesSearch && matchesDifficulty
  })

  const handleCreateSheet = async (sheetData: any) => {
    console.log('handleCreateSheet called with:', sheetData)
    console.log('adminProfile:', adminProfile)
    console.log('adminProfile?.id:', adminProfile?.id)
    
    const result = await createWorkoutSheet(sheetData)
    console.log('createWorkoutSheet result:', result)
    
    if (!result.error) {
      setShowCreateModal(false)
    }
    return result
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      searchWorkoutSheets(query)
    } else {
      // Recargar todas las planillas si la búsqueda está vacía
      // Esto se manejaría en el hook, pero por simplicidad lo hacemos aquí
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <Settings className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Acceso Restringido</h1>
          <p className="text-muted-foreground">
            Solo los administradores pueden acceder a este dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Administrador</h1>
              <p className="text-muted-foreground">
                {adminProfile?.organization_name || 'Panel de Control'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Planilla
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="sheets">Planillas</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Resumen Tab */}
          <TabsContent value="overview" className="space-y-6">
            <AdminStats 
              totalSheets={workoutSheets.length}
              totalUsers={0} // TODO: Implementar contador de usuarios
              completedSheets={0} // TODO: Implementar contador de planillas completadas
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Planillas Recientes</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{workoutSheets.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total de planillas creadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Usuarios asignados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progreso</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground">
                    Planillas completadas
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Planillas Tab */}
          <TabsContent value="sheets" className="space-y-6">
            {/* Filtros y búsqueda */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar planillas..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
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

            {/* Lista de planillas */}
            {sheetsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Cargando planillas...</p>
              </div>
            ) : filteredSheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay planillas</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No se encontraron planillas con ese criterio.' : 'Crea tu primera planilla de entrenamiento.'}
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Planilla
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSheets.map((sheet) => (
                  <Card key={sheet.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{sheet.title}</CardTitle>
                          <CardDescription>{sheet.description}</CardDescription>
                        </div>
                        <Badge variant={sheet.difficulty === 'beginner' ? 'default' : sheet.difficulty === 'intermediate' ? 'secondary' : 'destructive'}>
                          {sheet.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {sheet.category && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span className="font-medium">Categoría:</span>
                            <span className="ml-2">{sheet.category.name}</span>
                          </div>
                        )}
                        {sheet.estimated_duration && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{sheet.estimated_duration} min</span>
                          </div>
                        )}
                        {sheet.equipment_needed.length > 0 && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Dumbbell className="h-4 w-4 mr-2" />
                            <span>{sheet.equipment_needed.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sheet.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {sheet.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{sheet.tags.length - 3} más
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(sheet.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Usuarios Tab */}
          <TabsContent value="users" className="space-y-6">
            <UsersList adminId={adminProfile?.id} />
          </TabsContent>

          {/* Configuración Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Perfil</CardTitle>
                <CardDescription>
                  Gestiona la información de tu organización
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nombre de la Organización</label>
                    <p className="text-sm text-muted-foreground">
                      {adminProfile?.organization_name || 'No configurado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tipo de Organización</label>
                    <p className="text-sm text-muted-foreground">
                      {adminProfile?.organization_type || 'No configurado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email de Contacto</label>
                    <p className="text-sm text-muted-foreground">
                      {adminProfile?.email || 'No configurado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal para crear planilla */}
      <CreateWorkoutSheetModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        categories={categories}
        onSubmit={handleCreateSheet}
      />
    </div>
  )
}