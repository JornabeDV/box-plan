"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Users,
  Target,
  Calendar,
  CreditCard,
  MessageSquare,
  Database,
  Zap,
  Loader2,
  AlertCircle,
  Info,
  Copy,
} from "lucide-react";
import {
  useCoachPlanFeatures,
  type PlanificationAccess,
} from "@/hooks/use-coach-plan-features";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useDisciplines } from "@/hooks/use-disciplines";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { CoachLogoUploadInline } from "@/components/admin/coach-logo-upload-inline";
import { MotivationalQuotesManager } from "@/components/admin/motivational-quotes-manager";
import { CoachBusinessInfoForm } from "@/components/admin/coach-business-info-form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MyPlanSectionProps {
  coachId: string | null;
}

export function MyPlanSection({ coachId }: MyPlanSectionProps) {
  const {
    planInfo,
    loading,
    error,
    maxDisciplines,
    planificationAccess,
    hasFeature,
  } = useCoachPlanFeatures();
  const { disciplines } = useDisciplines(coachId);
  const { users } = useDashboardData(coachId);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Si hay error, mostrar mensaje de error
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Error al cargar información del plan
          </h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Si no hay planInfo pero tampoco hay error, el coach no tiene plan activo
  if (!planInfo && !loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No tienes un plan activo
          </h3>
          <p className="text-muted-foreground mb-4">
            Para acceder a las funcionalidades del dashboard, necesitas activar
            un plan de suscripción.
          </p>
          <Link href="/pricing/coaches">
            <Button variant="default">Ver Planes Disponibles</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // TypeScript guard: si llegamos aquí y no hay planInfo, no deberíamos continuar
  if (!planInfo) {
    return null;
  }

  const currentDisciplines = disciplines?.length || 0;
  const currentStudents = users?.length || 0;
  const maxStudents =
    planInfo.maxStudents === 999999 ? Infinity : planInfo.maxStudents;

  // Calcular porcentajes de uso
  const disciplinesUsage =
    maxDisciplines > 0
      ? Math.min((currentDisciplines / maxDisciplines) * 100, 100)
      : 0;

  const studentsUsage =
    maxStudents !== Infinity && maxStudents > 0
      ? Math.min((currentStudents / maxStudents) * 100, 100)
      : 0;

  // Helper para obtener label de planificación
  const getPlanificationLabel = (access: PlanificationAccess) => {
    switch (access) {
      case "weekly":
        return "Planificación Semanal";
      case "monthly":
        return "Planificación Mensual";
      case "unlimited":
        return "Planificación Ilimitada";
      default:
        return "Planificación";
    }
  };

  // Características del plan
  const features = [
    {
      key: "dashboard_custom",
      label: "Dashboard Personalizado",
      icon: Zap,
      enabled: planInfo.features.dashboard_custom,
    },
    {
      key: "planification_access",
      label: getPlanificationLabel(planificationAccess),
      icon: Calendar,
      enabled: true, // Siempre habilitado, muestra el tipo de acceso
    },
    {
      key: "personalized_planifications",
      label: "Planificaciones Personalizadas",
      icon: Users,
      enabled: planInfo.features.personalized_planifications,
    },
    {
      key: "replicate_planifications",
      label: "Duplicar/Replicar Planificaciones",
      icon: Copy,
      enabled: planInfo.features.replicate_planifications,
    },
    {
      key: "score_loading",
      label: "Carga de Scores",
      icon: Database,
      enabled: planInfo.features.score_loading,
    },
    {
      key: "score_database",
      label: "Base de Datos de Scores",
      icon: Database,
      enabled: planInfo.features.score_database,
    },
    {
      key: "mercadopago_connection",
      label: "Conexión MercadoPago",
      icon: CreditCard,
      enabled: planInfo.features.mercadopago_connection,
    },
    {
      key: "whatsapp_integration",
      label: "Integración WhatsApp",
      icon: MessageSquare,
      enabled: planInfo.features.whatsapp_integration,
    },
    {
      key: "community_forum",
      label: "Foro de Comunidad",
      icon: MessageSquare,
      enabled: planInfo.features.community_forum,
    },
    {
      key: "timer",
      label: "Cronómetro",
      icon: Zap,
      enabled: planInfo.features.timer,
    },
    {
      key: "custom_motivational_quotes",
      label: "Frases Motivacionales Personalizadas",
      icon: MessageSquare,
      enabled: planInfo.features.custom_motivational_quotes,
    },
  ];

  const enabledFeatures = features.filter((f) => f.enabled);

  // Ordenar características: habilitadas primero, luego deshabilitadas
  const sortedFeatures = [...features].sort((a, b) => {
    if (a.enabled && !b.enabled) return -1;
    if (!a.enabled && b.enabled) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Información del Plan */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex flex-col max-sm:gap-2 max-sm:items-start max-sm:justify-between">
              <div className="flex sm:flex-wrap items-center gap-3">
                <Badge
                  className={`text-sm sm:text-base px-2 sm:px-3 py-1 ${
                    planInfo.planName === "elite"
                      ? "bg-yellow-500"
                      : planInfo.planName === "power"
                        ? "bg-purple-500"
                        : "bg-blue-500"
                  }`}
                >
                  {planInfo.displayName}
                </Badge>
                {planInfo.isTrial && (
                  <Badge
                    variant="outline"
                    className="text-yellow-600 border-yellow-600"
                  >
                    Período de Prueba
                  </Badge>
                )}
                {planInfo.isActive && !planInfo.isTrial && (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600 text-sm sm:text-base px-2 sm:px-3 py-1"
                  >
                    Activo
                  </Badge>
                )}
              </div>
              {/* Fechas del período */}
              <div className="flex flex-col items-start gap-1 text-sm text-muted-foreground mt-5">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-white">
                    Período del plan
                  </span>
                  <span className="px-2 py-1 rounded bg-lime-500/10 text-lime-600 text-xs font-medium">
                    {Math.ceil(
                      (new Date(planInfo.currentPeriodEnd).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    días restantes
                  </span>
                </div>
                <div>
                  <span className="px-2 py-1 rounded bg-muted text-xs sm:text-sm">
                    Inicio:{" "}
                    {format(
                      new Date(planInfo.currentPeriodStart),
                      "dd/MM/yyyy",
                      {
                        locale: es,
                      },
                    )}
                  </span>

                  <span className="px-2 py-1 rounded bg-muted text-xs sm:text-sm">
                    Fin:{" "}
                    {format(new Date(planInfo.currentPeriodEnd), "dd/MM/yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link href="/pricing/coaches">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Ver Planes
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-3 md:px-6">
          {/* Logo del Coach */}
          <div className="pb-4 border-b">
            <CoachLogoUploadInline />
          </div>

          {/* Límites y Uso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estudiantes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Estudiantes</span>
                </div>
                <span className="text-sm font-semibold">
                  {currentStudents} /{" "}
                  {maxStudents === Infinity ? "Ilimitados" : maxStudents}
                </span>
              </div>
              {maxStudents !== Infinity && (
                <Progress value={studentsUsage} className="h-2" />
              )}
            </div>

            {/* Disciplinas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Disciplinas</span>
                </div>
                <span className="text-sm font-semibold">
                  {currentDisciplines} /{" "}
                  {maxDisciplines === 999999 ? "Ilimitadas" : maxDisciplines}
                </span>
              </div>
              {maxDisciplines !== 999999 && maxDisciplines > 0 && (
                <Progress value={disciplinesUsage} className="h-2" />
              )}
            </div>
          </div>

          {/* Planificación */}
          <div className="bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Acceso a Planificación
              </span>
            </div>
            <p className="text-lg font-semibold capitalize">
              {planificationAccess === "weekly" && "Semanal (semana actual)"}
              {planificationAccess === "monthly" && "Mensual (mes completo)"}
              {planificationAccess === "unlimited" &&
                "Ilimitada (histórico completo)"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Características del Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Características Incluidas</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-400"
                >
                  <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-lime-400 transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs bg-black border-2 border-lime-400 text-white [&>svg]:hidden"
              >
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                    [data-slot="tooltip-content"] svg {
                      display: none !important;
                    }
                  `,
                  }}
                />
                <div className="space-y-1">
                  <p className="font-medium">Comisión por Usuario</p>
                  <p className="text-sm opacity-90">
                    {planInfo.commissionRate}%
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">
            {enabledFeatures.length} de {features.length} características
            disponibles
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    feature.enabled
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                      : "bg-muted border-border opacity-50"
                  }`}
                >
                  {feature.enabled ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span
                    className={`text-sm ${
                      feature.enabled ? "font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {feature.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Datos del Negocio */}
      <CoachBusinessInfoForm />

      {/* Gestión de Frases Motivacionales */}
      <MotivationalQuotesManager
        coachId={coachId}
        hasFeature={hasFeature("custom_motivational_quotes")}
      />
    </div>
  );
}
