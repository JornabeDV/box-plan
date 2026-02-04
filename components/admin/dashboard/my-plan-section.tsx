"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import { useCoachPlanFeatures } from "@/hooks/use-coach-plan-features";
import Link from "next/link";
import { useDisciplines } from "@/hooks/use-disciplines";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { CoachLogoUploadInline } from "@/components/admin/coach-logo-upload-inline";
import { MotivationalQuotesManager } from "@/components/admin/motivational-quotes-manager";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MyPlanSectionProps {
  coachId: string | null;
}

export function MyPlanSection({ coachId }: MyPlanSectionProps) {
  const { planInfo, loading, error, maxDisciplines, hasFeature } =
    useCoachPlanFeatures();
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
          <p className="text-muted-foreground">
            {error}
          </p>
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
            Para acceder a las funcionalidades del dashboard, necesitas activar un plan de suscripción.
          </p>
          <Link href="/pricing/coaches">
            <Button variant="default">
              Ver Planes Disponibles
            </Button>
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

  // Características del plan
  const features = [
    {
      key: "dashboard_custom",
      label: "Dashboard Personalizado",
      icon: Zap,
      enabled: planInfo.features.dashboard_custom,
    },
    {
      key: "daily_planification",
      label: "Planificación Diaria",
      icon: Calendar,
      enabled: planInfo.features.daily_planification,
    },
    {
      key: "planification_monthly",
      label: "Planificación Mensual",
      icon: Calendar,
      enabled:
        planInfo.features.planification_monthly ||
        planInfo.features.planification_unlimited,
    },
    {
      key: "planification_unlimited",
      label: "Planificación Ilimitada",
      icon: Calendar,
      enabled: planInfo.features.planification_unlimited,
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-2xl mb-2">Mi Plan</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  className={`text-lg px-3 py-1 ${
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
                    className="text-green-600 border-green-600"
                  >
                    Activo
                  </Badge>
                )}
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
        <CardContent className="space-y-6">
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
          {planInfo.features.planification_weeks &&
            planInfo.features.planification_weeks > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Semanas de Planificación
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {planInfo.features.planification_weeks} semana
                  {planInfo.features.planification_weeks !== 1 ? "s" : ""}
                </p>
              </div>
            )}
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
          <p className="text-sm text-muted-foreground mt-1">
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

      {/* Gestión de Frases Motivacionales */}
      <MotivationalQuotesManager
        coachId={coachId}
        hasFeature={hasFeature("custom_motivational_quotes")}
      />
    </div>
  );
}
