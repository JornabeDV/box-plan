"use client";

import { useState, useEffect } from "react";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BarChart3,
  Search,
  Shield,
  Loader2,
  Settings,
} from "lucide-react";
import { SuperAdminStats } from "@/components/superadmin/super-admin-stats";
import { CoachesList } from "@/components/superadmin/coaches-list";
import { ChangePlanModal } from "@/components/superadmin/change-plan-modal";
import { CoachPlansList } from "@/components/superadmin/coach-plans-list";
import { SuperAdminHeader } from "@/components/superadmin/superadmin-header";
import { useToast } from "@/hooks/use-toast";

export default function SuperAdminPage() {
  const { user, isAdmin, loading: authLoading, sessionStatus } = useAuthWithRoles();
  const { toast } = useToast();
  const [coaches, setCoaches] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [coachPlans, setCoachPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (planFilter !== "all") params.append("plan", planFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(
        `/api/superadmin/coaches?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Error al cargar coaches");
      }

      const data = await response.json();
      setCoaches(data.coaches);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los coaches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await fetch("/api/superadmin/coach-plans");
      if (!response.ok) {
        throw new Error("Error al cargar planes");
      }

      const data = await response.json();
      setCoachPlans(data.plans);
    } catch (error) {
      console.error("Error fetching coach plans:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes",
        variant: "destructive",
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchCoaches();
      fetchCoachPlans();
    }
  }, [isAdmin, authLoading, searchQuery, planFilter, statusFilter]);

  const handleChangePlan = (coach: any) => {
    setSelectedCoach(coach);
    setShowChangePlanModal(true);
  };

  const handlePlanChanged = () => {
    setShowChangePlanModal(false);
    setSelectedCoach(null);
    fetchCoaches();
    toast({
      title: "Plan actualizado",
      description: "El plan del coach ha sido actualizado exitosamente",
    });
  };

  // Si no hay sesión (logout o no autenticado), no mostrar nada (el redirect ya está en proceso)
  if (sessionStatus === 'unauthenticated' || (!authLoading && !user)) {
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              Acceso Restringido
            </CardTitle>
            <CardDescription>
              No tienes permisos para acceder a esta sección.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      {/* Header */}
      <SuperAdminHeader />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1">
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
              value="coaches"
              className="cursor-pointer text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] transition-all duration-300 data-[state=active]:bg-lime-400/10 data-[state=active]:border-lime-400 data-[state=active]:shadow-[0_4px_15px_rgba(204,255,0,0.3)]"
            >
              <div className="flex flex-col items-center gap-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Coaches</span>
                <span className="sm:hidden text-xs">Coaches</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="plans"
              className="cursor-pointer text-xs sm:text-sm px-2 py-2 h-auto whitespace-nowrap relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] transition-all duration-300 data-[state=active]:bg-lime-400/10 data-[state=active]:border-lime-400 data-[state=active]:shadow-[0_4px_15px_rgba(204,255,0,0.3)]"
            >
              <div className="flex flex-col items-center gap-1">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Planes</span>
                <span className="sm:hidden text-xs">Planes</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {stats && <SuperAdminStats stats={stats} />}
          </TabsContent>

          {/* Coaches Tab */}
          <TabsContent value="coaches" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por email, nombre o negocio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
									<select
										value={planFilter}
										onChange={(e) => setPlanFilter(e.target.value)}
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
									>
										<option value="all">Todos los planes</option>
										{coachPlans.map((plan) => (
											<option key={plan.id} value={plan.name}>
												{plan.displayName}
											</option>
										))}
										<option value="no_plan">Sin plan</option>
									</select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="trial">En prueba</option>
                    <option value="expired">Expirados</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Coaches */}
            <CoachesList
              coaches={coaches}
              loading={loading}
              onChangePlan={handleChangePlan}
              onRefresh={fetchCoaches}
            />
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="flex flex-col gap-2 items-start">
              <h2 className="text-2xl font-bold">Planes de Coaches</h2>
              <p className="text-muted-foreground">
                Gestiona los planes disponibles para coaches (START, POWER,
                ELITE)
              </p>
            </div>

            <CoachPlansList
              plans={coachPlans}
              loading={loadingPlans}
              onRefresh={fetchCoachPlans}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal para cambiar plan */}
      {showChangePlanModal && selectedCoach && (
        <ChangePlanModal
          open={showChangePlanModal}
          onOpenChange={setShowChangePlanModal}
          coach={selectedCoach}
          onSuccess={handlePlanChanged}
        />
      )}
    </div>
  );
}
