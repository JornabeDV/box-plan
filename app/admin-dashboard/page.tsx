'use client'

import { useState, useEffect } from 'react'
import { useAuthWithRoles as useSimplifiedAuth } from '@/hooks/use-auth-with-roles'
import { useDisciplines } from '@/hooks/use-disciplines'
import { usePlanifications } from '@/hooks/use-planifications'
import { useUsersManagement } from '@/hooks/use-users-management'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Users, 
  BarChart3, 
  Settings,
  Calendar,
  Target,
  DollarSign,
  ArrowLeft
} from 'lucide-react'
import { AdminStats } from '@/components/admin/admin-stats'
import { UsersList } from '@/components/admin/users-list'
import { DisciplineModal } from '@/components/admin/discipline-modal'
import { DisciplinesList } from '@/components/admin/disciplines-list'
import { PlanificationModal } from '@/components/admin/planification-modal'
import { PlanificationCalendar } from '@/components/admin/planification-calendar'
import { PlanificationDayModal } from '@/components/admin/planification-day-modal'
import { SubscriptionPlansList } from '@/components/admin/subscription-plans-list'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export default function AdminDashboardPage() {
  const { user, coachProfile, loading: authLoading, isCoach, userRole } = useSimplifiedAuth()

  // Usar coachId (convertir a string para los hooks)
  const profileId = coachProfile?.id ? String(coachProfile.id) : null
  
  // Estado para el acceso del coach
  const [coachAccess, setCoachAccess] = useState<{
    hasAccess: boolean
    isTrial: boolean
    trialEndsAt: Date | null
    daysRemaining: number
  } | null>(null)
  const [loadingAccess, setLoadingAccess] = useState(true)

  const {
    disciplines,
    loading: disciplinesLoading,
    createDiscipline,
    updateDiscipline,
    deleteDiscipline,
    createDisciplineLevel,
    reorderDisciplines,
    reorderDisciplineLevels
  } = useDisciplines(profileId)

  const {
    planifications,
    loading: planificationsLoading,
    createPlanification,
    updatePlanification,
    deletePlanification,
    searchPlanifications
  } = usePlanifications(profileId || undefined)

  const { users } = useUsersManagement(profileId)

  const [activeTab, setActiveTab] = useState('overview')
  const [showDisciplineModal, setShowDisciplineModal] = useState(false)
  const [selectedDiscipline, setSelectedDiscipline] = useState<any>(null)
  const [showPlanificationModal, setShowPlanificationModal] = useState(false)
  const [selectedPlanification, setSelectedPlanification] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [dayPlanifications, setDayPlanifications] = useState<any[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [planificationToDelete, setPlanificationToDelete] = useState<any>(null)

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
    try {
      if (selectedPlanification) {
        const result = await updatePlanification(selectedPlanification.id, data)
        if (result.error) {
          return { error: result.error }
        }
      } else {
        const result = await createPlanification({ ...data, coach_id: profileId })
        
        if (result.error) {
          return { error: result.error }
        }
      }
      return { error: undefined }
    } catch (error) {
      return { error: 'Error inesperado al procesar la solicitud' }
    }
  }

  const handleDeletePlanification = (planification: any) => {
    setPlanificationToDelete(planification)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (planificationToDelete) {
      const result = await deletePlanification(planificationToDelete.id)
      if (result.error) {
        console.error('Error deleting planification:', result.error)
      }
      setPlanificationToDelete(null)
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

  // Cargar información de acceso del coach
  useEffect(() => {
    if (profileId && isCoach) {
      const fetchCoachAccess = async () => {
        try {
          setLoadingAccess(true)
          const response = await fetch('/api/coaches/access')
          if (response.ok) {
            const data = await response.json()
            const daysRemaining = data.trialEndsAt 
              ? Math.ceil((new Date(data.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : 0
            setCoachAccess({
              hasAccess: data.hasAccess,
              isTrial: data.isTrial,
              trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
              daysRemaining: Math.max(0, daysRemaining)
            })
          }
        } catch (error) {
          console.error('Error fetching coach access:', error)
        } finally {
          setLoadingAccess(false)
        }
      }
      fetchCoachAccess()
    }
  }, [profileId, isCoach])


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

  if (!isCoach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <Settings className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Acceso Restringido</h1>
          <p className="text-muted-foreground">
            Solo los coaches pueden acceder a este dashboard.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-left text-sm">
              <p><strong>Debug Info:</strong></p>
              <p>Usuario: {user?.email || 'No autenticado'}</p>
              <p>Rol: {userRole?.role || 'No asignado'}</p>
              <p>Coach Profile: {coachProfile?.businessName || 'No encontrado'}</p>
              <p>Loading: {authLoading ? 'Sí' : 'No'}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Verificar si el coach tiene acceso (suscripción activa o período de prueba válido)
  if (!loadingAccess && coachAccess && !coachAccess.hasAccess) {
    const trialEndDate = coachAccess.trialEndsAt 
      ? new Date(coachAccess.trialEndsAt).toLocaleDateString('es-AR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : null

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold">Período de Prueba Finalizado</h1>
          <p className="text-muted-foreground">
            {trialEndDate 
              ? `Tu período de prueba gratuito finalizó el ${trialEndDate}. Para continuar usando Box Plan con tus estudiantes, necesitas seleccionar un plan.`
              : 'Tu período de prueba gratuito de 7 días ha terminado. Para continuar usando Box Plan con tus estudiantes, necesitas seleccionar un plan.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button
              onClick={() => window.location.href = '/pricing/coaches'}
              className="hover:scale-100 active:scale-100"
            >
              Ver Planes y Precios
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="hover:scale-100 active:scale-100"
            >
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      {/* Banner de período de prueba */}
      {coachAccess?.isTrial && coachAccess.hasAccess && (
        <div className={`border-b ${
          coachAccess.daysRemaining <= 2 
            ? 'bg-yellow-500/10 border-yellow-500/20' 
            : 'bg-blue-500/10 border-blue-500/20'
        }`}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  coachAccess.daysRemaining <= 2 
                    ? 'text-yellow-700 dark:text-yellow-400' 
                    : 'text-blue-700 dark:text-blue-400'
                }`}>
                  {coachAccess.daysRemaining > 0 
                    ? `Período de prueba: ${coachAccess.daysRemaining} día${coachAccess.daysRemaining !== 1 ? 's' : ''} restante${coachAccess.daysRemaining !== 1 ? 's' : ''}`
                    : 'Tu período de prueba ha terminado'}
                </span>
              </div>
              {coachAccess.daysRemaining > 0 && (
                <Button
                  size="sm"
                  onClick={() => window.location.href = '/pricing/coaches'}
                  className="hover:scale-100 active:scale-100"
                >
                  Seleccionar Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

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
                <span className="hidden sm:inline">Volver al Inicio</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                  Dashboard Coach
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {coachProfile?.businessName || 'Panel de Control'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-1 h-auto p-1">
            <TabsTrigger 
              value="overview" 
              className="text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap"
            >
              <div className="flex flex-col items-center gap-1">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Resumen</span>
                <span className="sm:hidden text-xs">Resumen</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="disciplines" 
              className="text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap"
            >
              <div className="flex flex-col items-center gap-1">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Disciplinas</span>
                <span className="sm:hidden text-xs">Disciplinas</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="planning" 
              className="text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap"
            >
              <div className="flex flex-col items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Planificación</span>
                <span className="sm:hidden text-xs">Planificación</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap"
            >
              <div className="flex flex-col items-center gap-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Usuarios</span>
                <span className="sm:hidden text-xs">Usuarios</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="plans" 
              className="text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap"
            >
              <div className="flex flex-col items-center gap-1">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Planes</span>
                <span className="sm:hidden text-xs">Planes</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Resumen Tab */}
          <TabsContent value="overview" className="space-y-6">
            <AdminStats 
              totalSheets={planifications.length}
              totalUsers={users.length}
            />
          </TabsContent>

          {/* Disciplinas Tab */}
          <TabsContent value="disciplines" className="space-y-6">
            <div className="flex items-start justify-between max-md:flex-col max-sm:gap-2 gap-4">
              <div className='flex flex-col gap-2 items-start'>
                <h2 className="text-2xl font-bold">Disciplinas</h2>
                <p className="text-muted-foreground">
                  Gestiona las disciplinas y sus niveles de categorización
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setSelectedDiscipline(null)
                    setShowDisciplineModal(true)
                  }}
                  disabled={!profileId}
                >
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
            <div className="flex items-start justify-between max-md:flex-col max-sm:gap-2 gap-4">
              <div className='flex flex-col gap-2 items-start'>
                <h2 className="text-2xl font-bold">Planificaciones</h2>
                <p className="text-muted-foreground">
                  Gestiona las planificaciones de entrenamiento por disciplina y nivel
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setSelectedPlanification(null)
                    setShowPlanificationModal(true)
                  }}
                >
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
            <UsersList coachId={profileId} />
          </TabsContent>

          {/* Planes Tab */}
          <TabsContent value="plans" className="space-y-6">
            <SubscriptionPlansList />
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
        coachId={profileId}
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

      {/* Diálogo de confirmación para eliminar planificación */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Planificación"
        description={`¿Estás seguro de que quieres eliminar esta planificación? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}