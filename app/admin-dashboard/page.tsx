"use client";

import { useState, useEffect } from "react";
import { useAuthWithRoles as useSimplifiedAuth } from "@/hooks/use-auth-with-roles";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useDisciplines } from "@/hooks/use-disciplines";
import { usePlanifications } from "@/hooks/use-planifications";
import { useModalState } from "@/hooks/use-modal-state";
import { useDashboardCRUD } from "@/hooks/use-dashboard-crud";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Users,
  BarChart3,
  Calendar,
  Target,
  DollarSign,
  Package,
} from "lucide-react";
import { AdminStats } from "@/components/admin/admin-stats";
import { UsersList } from "@/components/admin/users-list";
import { DisciplineModal } from "@/components/admin/discipline-modal";
import { DisciplinesList } from "@/components/admin/disciplines-list";
import { PlanificationModal } from "@/components/admin/planification-modal";
import { PlanificationCalendar } from "@/components/admin/planification-calendar";
import { PlanificationDayModal } from "@/components/admin/planification-day-modal";
import { ReplicatePlanificationModal } from "@/components/admin/replicate-planification-modal";
import { StudentPlansManager } from "@/components/coach/student-plans-manager";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DashboardHeader } from "@/components/admin/dashboard/dashboard-header";
import { TrialBanner } from "@/components/admin/dashboard/trial-banner";
import { AccessRestricted } from "@/components/admin/dashboard/access-restricted";
import { TrialExpired } from "@/components/admin/dashboard/trial-expired";
import { LoadingScreen } from "@/components/admin/dashboard/loading-screen";
import { MercadoPagoConnect } from "@/components/coach/mercadopago-connect";
import { MyPlanSection } from "@/components/admin/dashboard/my-plan-section";

export default function AdminDashboardPage() {
  const {
    user,
    coachProfile,
    loading: authLoading,
    isCoach,
    userRole,
    sessionStatus,
  } = useSimplifiedAuth();
  const { toast } = useToast();

  // Usar coachId (convertir a string para los hooks)
  const profileId = coachProfile?.id ? String(coachProfile.id) : null;

  // Hook combinado que trae todos los datos en una sola petición
  const {
    disciplines: dashboardDisciplines,
    disciplineLevels: dashboardDisciplineLevels,
    planifications: dashboardPlanifications,
    users: dashboardUsers,
    subscriptionPlans: dashboardSubscriptionPlans,
    coachAccess: dashboardCoachAccess,
    loading: dashboardLoading,
    refresh: refreshDashboard,
  } = useDashboardData(profileId);

  // Hooks individuales solo para operaciones CRUD (no cargan datos iniciales)
  const { createDiscipline, updateDiscipline, deleteDiscipline } =
    useDisciplines(profileId);

  const { createPlanification, updatePlanification, deletePlanification } =
    usePlanifications(profileId || undefined);

  // Usar datos del dashboard combinado
  const disciplines = dashboardDisciplines;
  const planifications = dashboardPlanifications;
  const users = dashboardUsers;
  const coachAccess = dashboardCoachAccess
    ? {
        hasAccess: dashboardCoachAccess.hasAccess,
        isTrial: dashboardCoachAccess.isTrial,
        trialEndsAt: dashboardCoachAccess.trialEndsAt
          ? new Date(dashboardCoachAccess.trialEndsAt)
          : null,
        daysRemaining: dashboardCoachAccess.daysRemaining,
      }
    : null;

  // Hooks para manejar modales
  const disciplineModal = useModalState<any>();
  const planificationModal = useModalState<any>();
  const dayModal = useModalState<{ date: Date; planifications: any[] }>();
  const deleteDialog = useModalState<any>();
  const deleteDisciplineDialog = useModalState<any>();
  const deleteDisciplineErrorDialog = useModalState<{
    discipline: any;
    error: string;
  }>();
  const replicateModal = useModalState<{
    planifications: any[];
    sourceDate: Date | null;
  }>();

  // Hook para operaciones CRUD con refresh automático
  const { handleCRUDOperation } = useDashboardCRUD(refreshDashboard);

  // Estado para fecha seleccionada y planificaciones del día
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayPlanifications, setDayPlanifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Detectar tab desde URL (para redirecciones de OAuth)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (
        tabParam &&
        [
          "overview",
          "disciplines",
          "planning",
          "users",
          "plans",
          "my-plan",
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam);
        // Limpiar URL después de establecer el tab
        const newUrl =
          window.location.pathname +
          (params.toString() ? `?${params.toString()}` : "");
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  // Handler para cambiar tab con debug
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handlers para disciplinas
  const handleDisciplineSubmit = async (data: any) => {
    const operation = disciplineModal.selectedItem
      ? () => updateDiscipline({ ...data, id: disciplineModal.selectedItem.id })
      : () => createDiscipline(data);

    return handleCRUDOperation(operation, () => disciplineModal.close());
  };

  const handleEditDisciplineClick = (discipline: any) => {
    disciplineModal.open(discipline);
  };

  const handleDeleteDisciplineClick = async (discipline: any) => {
    // Verificar si hay usuarios vinculados antes de mostrar el modal de confirmación
    try {
      const response = await fetch(`/api/disciplines/${discipline.id}/check`);

      if (!response.ok) {
        throw new Error("Error al verificar disciplina");
      }

      const data = await response.json();

      if (!data.canDelete) {
        // Mostrar modal de error
        deleteDisciplineErrorDialog.open({
          discipline,
          error: `No se puede eliminar la disciplina "${
            data.disciplineName
          }" porque ${data.userCount} usuario${
            data.userCount !== 1 ? "s" : ""
          } tiene${
            data.userCount !== 1 ? "n" : ""
          } esta disciplina o sus niveles como preferencia. Por favor, actualiza las preferencias de los usuarios antes de eliminar.`,
        });
        return;
      }

      // Si no hay usuarios vinculados, mostrar el modal de confirmación
      deleteDisciplineDialog.open(discipline);
    } catch (err) {
      console.error("Error checking discipline:", err);
      // En caso de error, mostrar el modal de confirmación por seguridad
      deleteDisciplineDialog.open(discipline);
    }
  };

  const handleDeleteDisciplineConfirm = async () => {
    if (deleteDisciplineDialog.selectedItem) {
      const result = await handleCRUDOperation(
        () => deleteDiscipline(deleteDisciplineDialog.selectedItem.id),
        () => deleteDisciplineDialog.close(),
      );

      if (result.error) {
        toast({
          title: "Error al eliminar disciplina",
          description: result.error,
          variant: "destructive",
        });
      }
    }
  };

  // Handlers para planificaciones
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    planificationModal.open();
  };

  const handleEditPlanification = (planification: any) => {
    setSelectedDate(null);
    planificationModal.open(planification);
  };

  const handlePlanificationSubmit = async (
    data: any,
  ): Promise<{ error?: string }> => {
    const operation = planificationModal.selectedItem
      ? () =>
          updatePlanification(planificationModal.selectedItem.id, data).then(
            (r) => ({ error: r.error || undefined }),
          )
      : () =>
          createPlanification({ ...data, coach_id: profileId }).then((r) => ({
            error: r.error || undefined,
          }));

    const result = await handleCRUDOperation(operation, () => {
      planificationModal.close();
      setSelectedDate(null);
    });

    return { error: result.error || undefined };
  };

  const handleDeletePlanification = (planification: any) => {
    deleteDialog.open(planification);
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.selectedItem) {
      await handleCRUDOperation(
        () => deletePlanification(deleteDialog.selectedItem.id),
        () => deleteDialog.close(),
      );
    }
  };

  const handleViewDayPlanifications = (date: Date, planifications: any[]) => {
    setSelectedDate(date);
    setDayPlanifications(planifications);
    dayModal.open({ date, planifications });
  };

  const handleCreateFromDay = (date: Date) => {
    setSelectedDate(date);
    dayModal.close();
    planificationModal.open();
  };

  const handleEditFromDay = (planification: any) => {
    setSelectedDate(null);
    dayModal.close();
    planificationModal.open(planification);
  };

  const handleDeleteFromDay = async (planificationId: string) => {
    await handleCRUDOperation(
      () => deletePlanification(planificationId),
      () =>
        setDayPlanifications((prev) =>
          prev.filter((p) => p.id !== planificationId),
        ),
    );
  };

  // Handlers para replicar planificaciones
  const handleDuplicatePlanification = (planification: any) => {
    replicateModal.open({
      planifications: [planification],
      sourceDate: selectedDate,
    });
  };

  const handleDuplicateAll = () => {
    replicateModal.open({
      planifications: dayPlanifications,
      sourceDate: selectedDate,
    });
  };

  const handleReplicateConfirm = async (
    targetDate: Date,
    replaceExisting: boolean,
  ) => {
    if (!replicateModal.selectedItem) return;
    if (!profileId) {
      toast({
        title: "Error",
        description: "No se pudo identificar el coach",
        variant: "destructive",
      });
      return;
    }

    const planificationsToReplicate =
      replicateModal.selectedItem.planifications;

    // Función helper para normalizar fechas sin problemas de zona horaria
    const normalizeDate = (date: Date | string): string => {
      if (typeof date === "string") {
        // Si ya es string, tomar solo la parte de la fecha
        return date.split("T")[0];
      }
      // Crear fecha local sin timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    try {
      // Formatear fecha destino usando normalización local
      const targetDateString = normalizeDate(targetDate);

      // Si hay que reemplazar, primero eliminar las planificaciones existentes del día destino
      if (replaceExisting) {
        const existingPlanifications = planifications.filter((p) => {
          const planDateString = normalizeDate(p.date);
          return planDateString === targetDateString;
        });

        for (const existing of existingPlanifications) {
          await deletePlanification(existing.id);
        }
      }

      // Duplicar cada planificación
      let successCount = 0;
      let errorCount = 0;

      for (const planification of planificationsToReplicate) {
        const newPlanificationData = {
          coach_id: profileId,
          discipline_id:
            planification.discipline_id ||
            planification.disciplineId ||
            planification.discipline?.id,
          discipline_level_id:
            planification.discipline_level_id ||
            planification.disciplineLevelId ||
            planification.discipline_level?.id,
          date: targetDateString,
          estimated_duration: planification.estimated_duration,
          blocks: planification.blocks || [],
          notes: planification.notes || null,
          is_active:
            planification.is_active !== undefined
              ? planification.is_active
              : true,
          is_personalized: false,
          target_user_id: null,
        };

        const result = await createPlanification(newPlanificationData);
        if (result.error) {
          errorCount++;
        } else {
          successCount++;
        }
      }

      replicateModal.close();
      dayModal.close();
      refreshDashboard();

      // Mostrar notificación
      if (errorCount === 0) {
        toast({
          title: "Planificaciones replicadas",
          description: `${successCount} planificación${
            successCount !== 1 ? "es" : ""
          } replicada${successCount !== 1 ? "s" : ""} exitosamente`,
        });
      } else {
        toast({
          title: "Replicación parcial",
          description: `${successCount} replicada${
            successCount !== 1 ? "s" : ""
          } exitosamente, ${errorCount} con error${
            errorCount !== 1 ? "es" : ""
          }`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error replicando planificaciones:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al replicar las planificaciones",
        variant: "destructive",
      });
    }
  };

  // El coachAccess ahora viene del hook combinado, no necesitamos este useEffect

  // Estados de carga y acceso
  // Si no hay sesión (logout o no autenticado), no mostrar nada (el redirect ya está en proceso)
  if (sessionStatus === "unauthenticated" || (!authLoading && !user)) {
    return null;
  }

  // Mostrar loading solo una vez: durante authLoading o dashboardLoading inicial
  if (authLoading || (dashboardLoading && !coachAccess)) {
    return <LoadingScreen />;
  }

  if (!isCoach) {
    return (
      <AccessRestricted
        userEmail={user?.email}
        userRole={userRole?.role}
        businessName={coachProfile?.businessName}
        authLoading={authLoading}
      />
    );
  }

  if (coachAccess && !coachAccess.hasAccess) {
    return <TrialExpired trialEndDate={coachAccess.trialEndsAt} />;
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
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-1 h-auto p-1">
            <TabsTrigger
              value="overview"
              className="cursor-pointer text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] transition-all duration-300 data-[state=active]:bg-lime-400/10 data-[state=active]:border-lime-400 data-[state=active]:shadow-[0_4px_15px_rgba(204,255,0,0.3)]"
            >
              <div className="flex flex-col items-center gap-1">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Resumen</span>
                <span className="sm:hidden text-xs">Resumen</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="disciplines"
              className="cursor-pointer text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] transition-all duration-300 data-[state=active]:bg-lime-400/10 data-[state=active]:border-lime-400 data-[state=active]:shadow-[0_4px_15px_rgba(204,255,0,0.3)]"
            >
              <div className="flex flex-col items-center gap-1">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Disciplinas</span>
                <span className="sm:hidden text-xs">Disciplinas</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="planning"
              className="cursor-pointer text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] transition-all duration-300 data-[state=active]:bg-lime-400/10 data-[state=active]:border-lime-400 data-[state=active]:shadow-[0_4px_15px_rgba(204,255,0,0.3)]"
            >
              <div className="flex flex-col items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Planificación</span>
                <span className="sm:hidden text-xs">Planificación</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="cursor-pointer text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] transition-all duration-300 data-[state=active]:bg-lime-400/10 data-[state=active]:border-lime-400 data-[state=active]:shadow-[0_4px_15px_rgba(204,255,0,0.3)]"
            >
              <div className="flex flex-col items-center gap-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Estudiantes</span>
                <span className="sm:hidden text-xs">Estudiantes</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="plans"
              className="cursor-pointer text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] transition-all duration-300 data-[state=active]:bg-lime-400/10 data-[state=active]:border-lime-400 data-[state=active]:shadow-[0_4px_15px_rgba(204,255,0,0.3)]"
            >
              <div className="flex flex-col items-center gap-1">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Planes</span>
                <span className="sm:hidden text-xs">Planes</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="my-plan"
              className="cursor-pointer text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] transition-all duration-300 data-[state=active]:bg-lime-400/10 data-[state=active]:border-lime-400 data-[state=active]:shadow-[0_4px_15px_rgba(204,255,0,0.3)]"
            >
              <div className="flex flex-col items-center gap-1">
                <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Mi Plan</span>
                <span className="sm:hidden text-xs">Mi Plan</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Resumen Tab */}
          <TabsContent value="overview" className="space-y-6">
            <AdminStats
              users={users}
              planifications={planifications}
              onTabChange={setActiveTab}
            />
          </TabsContent>

          {/* Disciplinas Tab */}
          <TabsContent value="disciplines" className="space-y-6">
            <div className="flex items-start justify-between max-md:flex-col max-sm:gap-2 gap-4 max-sm:mb-3">
              <div className="flex flex-col gap-2 items-start">
                <h2 className="text-2xl font-bold">Disciplinas</h2>
                <p className="text-muted-foreground sm:text-base text-sm">
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
              onDelete={handleDeleteDisciplineClick}
            />
          </TabsContent>

          {/* Planificación Tab */}
          <TabsContent value="planning" className="space-y-6">
            <div className="flex flex-col gap-2 items-start">
              <h2 className="text-2xl font-bold">Planificaciones</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gestiona las planificaciones de entrenamiento por disciplina y
                nivel. Haz clic en un día del calendario para crear una nueva
                planificación.
              </p>
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
            {/* Conexión con MercadoPago */}
            <StudentPlansManager />
            <MercadoPagoConnect coachId={coachProfile?.id} />
          </TabsContent>

          {/* Mi Plan Tab */}
          <TabsContent value="my-plan" className="space-y-6">
            <div className="flex flex-col gap-2 items-start">
              <h2 className="text-2xl font-bold">Mi Plan</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Información sobre tu plan actual y características disponibles
              </p>
            </div>
            <MyPlanSection coachId={profileId} />
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
          planificationModal.handleOpenChange(open);
          if (!open) {
            setSelectedDate(null);
          }
        }}
        planification={planificationModal.selectedItem}
        selectedDate={selectedDate}
        coachId={profileId}
        students={users.map((user) => ({
          id: String(user.id),
          name: user.name,
          email: user.email,
        }))}
        onSubmit={handlePlanificationSubmit}
      />

      {/* Modal para ver planificaciones del día */}
      <PlanificationDayModal
        open={dayModal.isOpen}
        onOpenChange={(open: boolean) => {
          dayModal.handleOpenChange(open);
          if (!open) {
            setSelectedDate(null);
            setDayPlanifications([]);
          }
        }}
        selectedDate={selectedDate}
        planifications={dayPlanifications}
        onEdit={handleEditFromDay}
        onDelete={handleDeleteFromDay}
        onCreate={handleCreateFromDay}
        onDuplicate={handleDuplicatePlanification}
        onDuplicateAll={handleDuplicateAll}
      />

      {/* Modal para replicar planificaciones */}
      {replicateModal.selectedItem && (
        <ReplicatePlanificationModal
          open={replicateModal.isOpen}
          onOpenChange={replicateModal.handleOpenChange}
          onConfirm={handleReplicateConfirm}
          sourceDate={replicateModal.selectedItem.sourceDate}
          planificationCount={replicateModal.selectedItem.planifications.length}
        />
      )}

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

      {/* Diálogo de confirmación para eliminar disciplina */}
      <ConfirmationDialog
        open={deleteDisciplineDialog.isOpen}
        onOpenChange={deleteDisciplineDialog.handleOpenChange}
        onConfirm={handleDeleteDisciplineConfirm}
        title="Eliminar Disciplina"
        description={`¿Estás seguro de que quieres eliminar la disciplina "${deleteDisciplineDialog.selectedItem?.name}"? Esta acción eliminará también todos sus niveles y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />

      {/* Diálogo de error al eliminar disciplina */}
      <ConfirmationDialog
        open={deleteDisciplineErrorDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            deleteDisciplineErrorDialog.close();
          }
        }}
        onConfirm={() => deleteDisciplineErrorDialog.close()}
        title="No se puede eliminar la disciplina"
        description={deleteDisciplineErrorDialog.selectedItem?.error || ""}
        confirmText="Entendido"
        cancelText={null}
        variant="destructive"
      />
    </div>
  );
}
