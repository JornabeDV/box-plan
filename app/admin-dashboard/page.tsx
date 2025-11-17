'use client'

import { useState } from 'react'
import { useAuthWithRoles as useSimplifiedAuth } from '@/hooks/use-auth-with-roles'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useDisciplines } from '@/hooks/use-disciplines'
import { usePlanifications } from '@/hooks/use-planifications'
import { useModalState } from '@/hooks/use-modal-state'
import { useDashboardCRUD } from '@/hooks/use-dashboard-crud'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Users, 
  BarChart3, 
  Calendar,
  Target,
  DollarSign
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
import { DashboardHeader } from '@/components/admin/dashboard/dashboard-header'
import { TrialBanner } from '@/components/admin/dashboard/trial-banner'
import { AccessRestricted } from '@/components/admin/dashboard/access-restricted'
import { TrialExpired } from '@/components/admin/dashboard/trial-expired'
import { LoadingScreen } from '@/components/admin/dashboard/loading-screen'

export default function AdminDashboardPage() {
  const { user, coachProfile, loading: authLoading, isCoach, userRole } = useSimplifiedAuth()

  // Usar coachId (convertir a string para los hooks)
  const profileId = coachProfile?.id ? String(coachProfile.id) : null
  
  // Hook combinado que trae todos los datos en una sola petición
  const {
    disciplines: dashboardDisciplines,
    disciplineLevels: dashboardDisciplineLevels,
    planifications: dashboardPlanifications,
    users: dashboardUsers,
    subscriptionPlans: dashboardSubscriptionPlans,
    coachAccess: dashboardCoachAccess,
    loading: dashboardLoading,
    refresh: refreshDashboard
  } = useDashboardData(profileId)

  // Hooks individuales solo para operaciones CRUD (no cargan datos iniciales)
  const {
    createDiscipline,
    updateDiscipline,
    deleteDiscipline,    
    reorderDisciplines,
    reorderDisciplineLevels,
  } = useDisciplines(profileId)

  const {
    createPlanification,
    updatePlanification,
    deletePlanification,
    searchPlanifications
  } = usePlanifications(profileId || undefined)

  // Usar datos del dashboard combinado
  const disciplines = dashboardDisciplines
  const planifications = dashboardPlanifications
  const users = dashboardUsers
  const coachAccess = dashboardCoachAccess ? {
    hasAccess: dashboardCoachAccess.hasAccess,
    isTrial: dashboardCoachAccess.isTrial,
    trialEndsAt: dashboardCoachAccess.trialEndsAt ? new Date(dashboardCoachAccess.trialEndsAt) : null,
    daysRemaining: dashboardCoachAccess.daysRemaining
  } : null

  // Hooks para manejar modales
  const disciplineModal = useModalState<any>()
  const planificationModal = useModalState<any>()
  const dayModal = useModalState<{ date: Date; planifications: any[] }>()
  const deleteDialog = useModalState<any>()

  // Hook para operaciones CRUD con refresh automático
  const { handleCRUDOperation } = useDashboardCRUD(refreshDashboard)

  // Estado para fecha seleccionada y planificaciones del día
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dayPlanifications, setDayPlanifications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  // Handlers para disciplinas
  const handleDisciplineSubmit = async (data: any) => {
    const operation = disciplineModal.selectedItem
      ? () => updateDiscipline({ ...data, id: disciplineModal.selectedItem.id })
      : () => createDiscipline(data)

    return handleCRUDOperation(operation, () => disciplineModal.close())
  }

  const handleEditDisciplineClick = (discipline: any) => {
    disciplineModal.open(discipline)
  }

  const handleDeleteDiscipline = async (disciplineId: string) => {
    await handleCRUDOperation(() => deleteDiscipline(disciplineId))
  }

  // Handlers para planificaciones
  const handleCreatePlanification = () => {
    setSelectedDate(null)
    planificationModal.open()
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    planificationModal.open()
  }

  const handleEditPlanification = (planification: any) => {
    setSelectedDate(null)
    planificationModal.open(planification)
  }

  const handlePlanificationSubmit = async (data: any): Promise<{ error?: string }> => {
    const operation = planificationModal.selectedItem
      ? () => updatePlanification(planificationModal.selectedItem.id, data).then(r => ({ error: r.error || undefined }))
      : () => createPlanification({ ...data, coach_id: profileId }).then(r => ({ error: r.error || undefined }))

    const result = await handleCRUDOperation(operation, () => {
      planificationModal.close()
      setSelectedDate(null)
    })
    
    return { error: result.error || undefined }
  }

  const handleDeletePlanification = (planification: any) => {
    deleteDialog.open(planification)
  }

  const handleDeleteConfirm = async () => {
    if (deleteDialog.selectedItem) {
      await handleCRUDOperation(
        () => deletePlanification(deleteDialog.selectedItem.id),
        () => deleteDialog.close()
      )
    }
  }

  const handleViewDayPlanifications = (date: Date, planifications: any[]) => {
    setSelectedDate(date)
    setDayPlanifications(planifications)
    dayModal.open({ date, planifications })
  }

  const handleCreateFromDay = (date: Date) => {
    setSelectedDate(date)
    dayModal.close()
    planificationModal.open()
  }

  const handleEditFromDay = (planification: any) => {
    setSelectedDate(null)
    dayModal.close()
    planificationModal.open(planification)
  }

  const handleDeleteFromDay = async (planificationId: string) => {
    await handleCRUDOperation(
      () => deletePlanification(planificationId),
      () => setDayPlanifications(prev => prev.filter(p => p.id !== planificationId))
    )
  }

  // El coachAccess ahora viene del hook combinado, no necesitamos este useEffect


  // Estados de carga y acceso
  if (authLoading) {
    return <LoadingScreen />
  }

  if (!isCoach) {
    return (
      <AccessRestricted
        userEmail={user?.email}
        userRole={userRole?.role}
        businessName={coachProfile?.businessName}
        authLoading={authLoading}
      />
    )
  }

  if (!dashboardLoading && coachAccess && !coachAccess.hasAccess) {
    return <TrialExpired trialEndDate={coachAccess.trialEndsAt} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      {/* Banner de período de prueba */}
      {coachAccess?.isTrial && coachAccess.hasAccess && (
        <TrialBanner
          isTrial={coachAccess.isTrial}
          hasAccess={coachAccess.hasAccess}
          daysRemaining={coachAccess.daysRemaining}
        />
      )}

      {/* Header */}
      <DashboardHeader businessName={coachProfile?.businessName} />

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
                <span className="hidden sm:inline">Estudiantes</span>
                <span className="sm:hidden text-xs">Estudiantes</span>
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
              users={users}
              planifications={planifications}
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
                  onClick={() => disciplineModal.open()}
                  disabled={!profileId}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Disciplina
                </Button>
              </div>
            </div>

            <DisciplinesList
              disciplines={disciplines}
              loading={dashboardLoading}
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
                <Button onClick={handleCreatePlanification}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Planificación
                </Button>
              </div>
            </div>

            <PlanificationCalendar
              planifications={planifications}
              loading={dashboardLoading}
              onDateClick={handleDateClick}
              onEditPlanification={handleEditPlanification}
              onDeletePlanification={handleDeletePlanification}
              onViewDayPlanifications={handleViewDayPlanifications}
            />
          </TabsContent>

          {/* Estudiantes Tab */}
          <TabsContent value="users" className="space-y-6">
            <UsersList 
              coachId={profileId} 
              initialUsers={users}
              initialPlans={dashboardSubscriptionPlans}
              onRefresh={refreshDashboard}
            />
          </TabsContent>

          {/* Planes Tab */}
          <TabsContent value="plans" className="space-y-6">
            <SubscriptionPlansList 
              initialPlans={dashboardSubscriptionPlans}
              onRefresh={refreshDashboard}
            />
          </TabsContent>

        </Tabs>
      </div>


      {/* Modal para crear/editar disciplina */}
      <DisciplineModal
        open={disciplineModal.isOpen}
        onOpenChange={disciplineModal.handleOpenChange}
        discipline={disciplineModal.selectedItem}
        onSubmit={handleDisciplineSubmit}
      />

      {/* Modal para crear/editar planificación */}
      <PlanificationModal
        open={planificationModal.isOpen}
        onOpenChange={(open: boolean) => {
          planificationModal.handleOpenChange(open)
          if (!open) {
            setSelectedDate(null)
          }
        }}
        planification={planificationModal.selectedItem}
        selectedDate={selectedDate}
        coachId={profileId}
        onSubmit={handlePlanificationSubmit}
      />

      {/* Modal para ver planificaciones del día */}
      <PlanificationDayModal
        open={dayModal.isOpen}
        onOpenChange={(open: boolean) => {
          dayModal.handleOpenChange(open)
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
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.handleOpenChange}
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