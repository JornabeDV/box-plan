'use client'

import { useState } from 'react'
import { useSimplifiedAuth } from '@/hooks/use-simplified-auth'
import { useAdminWorkoutSheets } from '@/hooks/use-admin-workout-sheets'
import { useDisciplines } from '@/hooks/use-disciplines'
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
  Trash2,
  ArrowLeft,
  Home
} from 'lucide-react'
import { AdminStats } from '@/components/admin/admin-stats'
import { UsersList } from '@/components/admin/users-list'
import { DisciplineModal } from '@/components/admin/discipline-modal'
import { DisciplinesList } from '@/components/admin/disciplines-list'
import { PlanificationModal } from '@/components/admin/planification-modal'
import { PlanificationCalendar } from '@/components/admin/planification-calendar'
import { PlanificationDayModal } from '@/components/admin/planification-day-modal'
import { usePlanifications } from '@/hooks/use-planifications'

export default function AdminDashboardPage() {
  const { user, adminProfile, loading: authLoading, isAdmin } = useSimplifiedAuth()
  const { 
    workoutSheets, 
    categories, 
    loading: sheetsLoading, 
    searchWorkoutSheets 
  } = useAdminWorkoutSheets(adminProfile?.id || null)


  const {
    disciplines,
    loading: disciplinesLoading,
    createDiscipline,
    updateDiscipline,
    deleteDiscipline,
    createDisciplineLevel,
    reorderDisciplines,
    reorderDisciplineLevels
  } = useDisciplines(adminProfile?.id || null)

  const {
    planifications,
    loading: planificationsLoading,
    createPlanification,
    updatePlanification,
    deletePlanification,
    searchPlanifications
  } = usePlanifications(adminProfile?.id)

  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [showDisciplineModal, setShowDisciplineModal] = useState(false)
  const [selectedDiscipline, setSelectedDiscipline] = useState<any>(null)
  const [showPlanificationModal, setShowPlanificationModal] = useState(false)
  const [selectedPlanification, setSelectedPlanification] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [dayPlanifications, setDayPlanifications] = useState<any[]>([])

  // Filtrar planillas según búsqueda y dificultad
  const filteredSheets = workoutSheets.filter(sheet => {
    const matchesSearch = searchQuery === '' || 
      sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sheet.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sheet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesDifficulty = selectedDifficulty === 'all' || sheet.difficulty === selectedDifficulty
    
    return matchesSearch && matchesDifficulty
  })



  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      searchWorkoutSheets(query)
    } else {
      // Recargar todas las planillas si la búsqueda está vacía
      // Esto se manejaría en el hook, pero por simplicidad lo hacemos aquí
    }
  }

  const handleCreateDiscipline = async (data: any) => {
    const result = await createDiscipline(data) as { error?: string }
    
    if (!result.error) {
      setShowDisciplineModal(false)
    }
    return { error: result.error || undefined }
  }

  const handleEditDiscipline = async (data: any) => {
    const result = await updateDiscipline(data) as { error?: string }
    
    if (!result.error) {
      setShowDisciplineModal(false)
      setSelectedDiscipline(null)
    }
    return { error: result.error || undefined }
  }

  const handleDisciplineSubmit = async (data: any) => {
    if (selectedDiscipline) {
      return await handleEditDiscipline({ ...data, id: selectedDiscipline.id })
    } else {
      return await handleCreateDiscipline(data)
    }
  }

  const handleEditDisciplineClick = (discipline: any) => {
    setSelectedDiscipline(discipline)
    setShowDisciplineModal(true)
  }

  const handleDeleteDiscipline = async (disciplineId: string) => {
    try {
      const result = await deleteDiscipline(disciplineId)
      if (result.error) {
        console.error('Error deleting discipline:', result.error)
      } else {
        console.log('Discipline deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting discipline:', error)
    }
  }

  // Funciones para planificaciones
  const handleCreatePlanification = () => {
    setSelectedPlanification(null)
    setSelectedDate(null)
    setShowPlanificationModal(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedPlanification(null)
    setShowPlanificationModal(true)
  }

  const handleEditPlanification = (planification: any) => {
    setSelectedPlanification(planification)
    setSelectedDate(null)
    setShowPlanificationModal(true)
  }

  const handlePlanificationSubmit = async (data: any) => {
    if (selectedPlanification) {
      const result = await updatePlanification(selectedPlanification.id, data)
      if (result.error) {
        console.error('Error updating planification:', result.error)
        return { error: result.error }
      }
    } else {
      const result = await createPlanification({ ...data, admin_id: adminProfile?.id })
      if (result.error) {
        console.error('Error creating planification:', result.error)
        return { error: result.error }
      }
    }
    return { error: undefined }
  }

  const handleDeletePlanification = async (planificationId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta planificación?')) {
      const result = await deletePlanification(planificationId)
      if (result.error) {
        console.error('Error deleting planification:', result.error)
      }
    }
  }

  const handleViewDayPlanifications = (date: Date, planifications: any[]) => {
    setSelectedDate(date)
    setDayPlanifications(planifications)
    setShowDayModal(true)
  }

  const handleCreateFromDay = (date: Date) => {
    setSelectedDate(date)
    setSelectedPlanification(null)
    setShowDayModal(false)
    setShowPlanificationModal(true)
  }

  const handleEditFromDay = (planification: any) => {
    setSelectedPlanification(planification)
    setSelectedDate(null)
    setShowDayModal(false)
    setShowPlanificationModal(true)
  }

  const handleDeleteFromDay = async (planificationId: string) => {
    const result = await deletePlanification(planificationId)
    if (result.error) {
      console.error('Error deleting planification:', result.error)
    } else {
      // Actualizar la lista de planificaciones del día
      setDayPlanifications(prev => prev.filter(p => p.id !== planificationId))
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
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Inicio
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Dashboard Administrador</h1>
                <p className="text-muted-foreground">
                  {adminProfile?.organization_name || 'Panel de Control'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="disciplines">Disciplinas</TabsTrigger>
            <TabsTrigger value="planning">Planificación</TabsTrigger>
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

          {/* Disciplinas Tab */}
          <TabsContent value="disciplines" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Disciplinas</h2>
                <p className="text-muted-foreground">
                  Gestiona las disciplinas y sus niveles de categorización
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  setSelectedDiscipline(null)
                  setShowDisciplineModal(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Disciplina
                </Button>
              </div>
            </div>

            <DisciplinesList
              disciplines={disciplines}
              loading={disciplinesLoading}
              onEdit={handleEditDisciplineClick}
              onDelete={handleDeleteDiscipline}
              onReorder={reorderDisciplines}
              onReorderLevels={reorderDisciplineLevels}
            />
          </TabsContent>

          {/* Planificación Tab */}
          <TabsContent value="planning" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Planificaciones</h2>
                <p className="text-muted-foreground">
                  Gestiona las planificaciones de entrenamiento por disciplina y nivel
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  setSelectedPlanification(null)
                  setShowPlanificationModal(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Planificación
                </Button>
              </div>
            </div>

            <PlanificationCalendar
              planifications={planifications}
              loading={planificationsLoading}
              onDateClick={handleDateClick}
              onEditPlanification={handleEditPlanification}
              onDeletePlanification={handleDeletePlanification}
              onViewDayPlanifications={handleViewDayPlanifications}
            />
          </TabsContent>

          {/* Usuarios Tab */}
          <TabsContent value="users" className="space-y-6">
            <UsersList adminId={adminProfile?.id || null} />
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


      {/* Modal para crear/editar disciplina */}
      <DisciplineModal
        open={showDisciplineModal}
        onOpenChange={(open: boolean) => {
          setShowDisciplineModal(open)
          if (!open) {
            setSelectedDiscipline(null)
          }
        }}
        discipline={selectedDiscipline}
        onSubmit={handleDisciplineSubmit}
      />

      {/* Modal para crear/editar planificación */}
      <PlanificationModal
        open={showPlanificationModal}
        onOpenChange={(open: boolean) => {
          setShowPlanificationModal(open)
          if (!open) {
            setSelectedPlanification(null)
            setSelectedDate(null)
          }
        }}
        planification={selectedPlanification}
        selectedDate={selectedDate}
        adminId={adminProfile?.id}
        onSubmit={handlePlanificationSubmit}
      />

      {/* Modal para ver planificaciones del día */}
      <PlanificationDayModal
        open={showDayModal}
        onOpenChange={(open: boolean) => {
          setShowDayModal(open)
          if (!open) {
            setSelectedDate(null)
            setDayPlanifications([])
          }
        }}
        selectedDate={selectedDate}
        planifications={dayPlanifications}
        onEdit={handleEditFromDay}
        onDelete={handleDeleteFromDay}
        onCreate={handleCreateFromDay}
      />
    </div>
  )
}