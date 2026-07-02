"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Users,
  Calendar,
  MessageCircle,
  Trophy,
  Target,
  CheckCircle2,
  Timer,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachPlanInfo } from "@/hooks/use-coach-plan-features";

interface StudentPlan {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  tier: string;
  planificationAccess: string;
  features: Record<string, any>;
  isActive: boolean;
  is_personalized?: boolean;
  shareToken?: string | null;
  _count?: {
    subscriptions: number;
  };
}

interface StudentPlansListProps {
  plans: StudentPlan[];
  coachPlan: CoachPlanInfo | null;
  onCreatePlan: () => void;
  onEditPlan?: (plan: StudentPlan) => void;
  onDeletePlan?: (plan: StudentPlan) => void;
  loading?: boolean;
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  basic: { label: "Básico", color: "bg-gray-500" },
  standard: { label: "Estándar", color: "bg-blue-500" },
  premium: { label: "Premium", color: "bg-purple-500" },
  vip: { label: "VIP", color: "bg-yellow-500" },
};

type FeatureConfig = {
  label: string;
  icon: typeof CheckCircle2;
};

const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  whatsappSupport: { icon: MessageCircle, label: "Soporte por WhatsApp" },
  communityAccess: { icon: Users, label: "Acceso a comunidad" },
  progressTracking: { icon: Target, label: "Seguimiento de progreso" },
  leaderboardAccess: { icon: Trophy, label: "Acceso a Ranking" },
  timerAccess: { icon: Timer, label: "Cronómetro" },
};

export function StudentPlansList({
  plans,
  coachPlan,
  onCreatePlan,
  onEditPlan,
  onDeletePlan,
}: StudentPlansListProps) {
  const [selectedPlan, setSelectedPlan] = useState<StudentPlan | null>(null);
  const [copiedPlanId, setCopiedPlanId] = useState<number | null>(null);

  const handleCopyLink = async (plan: StudentPlan) => {
    let token = plan.shareToken;

    // Si el plan es personalizado pero no tiene token, intentar regenerarlo
    if (plan.is_personalized && !token) {
      try {
        const response = await fetch(`/api/subscription-plans/${plan.id}/share-token`, {
          method: 'PATCH',
        });
        if (response.ok) {
          const data = await response.json();
          token = data.shareToken || data.share_token;
        }
      } catch (err) {
        console.error('Error regenerating share token:', err);
      }
    }

    // Último fallback al ID (no recomendado para planes personalizados)
    token = token || String(plan.id);

    const url = `${window.location.origin}/choose-plan?plan=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedPlanId(plan.id);
      setTimeout(() => setCopiedPlanId(null), 2000);
    });
  };

  if (!coachPlan) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando información...</p>
        </CardContent>
      </Card>
    );
  }

  const maxPlans = coachPlan.maxStudentPlans || 2;
  const currentCount = plans.length;
  const usagePercentage = (currentCount / maxPlans) * 100;

  const getFeatureIcon = (feature: string) =>
    FEATURE_CONFIG[feature]?.icon || CheckCircle2;

  const getFeatureLabel = (feature: string) =>
    FEATURE_CONFIG[feature]?.label || feature;

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header con contador */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Mis Planes para Alumnos</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gestiona los planes de suscripción que ofreces a tus alumnos
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barra de progreso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Planes creados</span>
                <span className="font-medium">
                  {currentCount} de {maxPlans}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>

            {/* Mensaje de límite */}
            {currentCount >= maxPlans && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-700">
                  Has alcanzado el límite de {maxPlans} planes.{" "}
                  {coachPlan.planName !== "elite" && (
                    <a
                      href="/pricing/coaches"
                      className="font-medium underline hover:no-underline"
                    >
                      Upgradea tu plan para crear más
                    </a>
                  )}
                </p>
              </div>
            )}

            {/* Info del plan del coach */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Tu plan:</span>
              <Badge variant="outline">{coachPlan.displayName}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de planes */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold mb-2">
              No tienes planes creados
            </h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Crea tu primer plan de suscripción para que tus alumnos puedan
              contratar tus servicios
            </p>
            <Button onClick={onCreatePlan} disabled={currentCount >= maxPlans}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const tierInfo = TIER_LABELS[plan.tier] || TIER_LABELS.basic;
            const activeSubscribers = plan._count?.subscriptions || 0;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative overflow-hidden transition-all hover:shadow-md justify-between",
                  !plan.isActive && "opacity-75",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.is_personalized && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                        Personalizado
                      </Badge>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Precio */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.interval === "month" ? "mes" : "año"}
                    </span>
                  </div>

                  {/* Planificación */}
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="capitalize">
                      {plan.planificationAccess === "weekly" &&
                        "Planificación Semanal"}
                      {plan.planificationAccess === "monthly" &&
                        "Planificación Mensual"}
                      {plan.planificationAccess === "unlimited" &&
                        "Planificación Ilimitada"}
                    </span>
                  </div>

                  {/* Suscriptores */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {activeSubscribers} suscriptor
                      {activeSubscribers !== 1 ? "es" : ""}
                    </span>
                  </div>

                  {/* Features habilitadas */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      Incluye:
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(plan.features || {})
                        .filter(([_, value]) => value === true)
                        .slice(0, 4)
                        .map(([key]) => {
                          const Icon = getFeatureIcon(key);
                          const label = getFeatureLabel(key);

                          return (
                            <div
                              key={key}
                              className="inline-flex items-center gap-1 py-1 bg-muted rounded text-xs"
                              title={label}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{label}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Botones de acción */}
                </CardContent>
                <div className="flex flex-col gap-2 px-3 sm:px-6 pb-6">
                  {plan.is_personalized && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleCopyLink(plan)}
                    >
                      {copiedPlanId === plan.id ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Copiar link
                        </>
                      )}
                    </Button>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {onEditPlan && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onEditPlan(plan)}
                      >
                        Editar
                      </Button>
                    )}
                    {onDeletePlan && (
                      <Button
                        variant="outline"
                        className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => onDeletePlan(plan)}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}


    </div>
  );
}
