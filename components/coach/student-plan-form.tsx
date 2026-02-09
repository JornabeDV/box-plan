"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
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
}

interface StudentPlanFormProps {
  coachPlan: CoachPlanInfo | null;
  currentPlansCount: number;
  editingPlan?: StudentPlan | null;
  onSubmit: (data: StudentPlanFormData) => Promise<void>;
  onCancel: () => void;
}

export interface StudentPlanFormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  tier: string;
  features: {
    // Features del plan del coach
    whatsappSupport: boolean;        // coach: whatsapp_integration
    communityAccess: boolean;        // coach: community_forum
    progressTracking: boolean;       // coach: score_loading
    leaderboardAccess: boolean;      // coach: score_database
    timerAccess: boolean;            // coach: timer
    personalizedWorkouts: boolean;   // coach: personalized_planifications
  };
}

const TIER_OPTIONS = [
  { value: "basic", label: "Básico", description: "Acceso esencial" },
  { value: "standard", label: "Estándar", description: "Más features" },
  { value: "premium", label: "Premium", description: "Experiencia completa" },
  { value: "vip", label: "VIP", description: "Acceso exclusivo" },
];

const INTERVALS = [
  { value: "month", label: "Mensual" },
  { value: "year", label: "Anual" },
];

export function StudentPlanForm({
  coachPlan,
  currentPlansCount,
  editingPlan,
  onSubmit,
  onCancel,
}: StudentPlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!editingPlan;

  const [formData, setFormData] = useState<StudentPlanFormData>({
    name: editingPlan?.name || "",
    description: editingPlan?.description || "",
    price: editingPlan?.price || 0,
    currency: editingPlan?.currency || "ARS",
    interval: editingPlan?.interval || "month",
    tier: editingPlan?.tier || "basic",
    features: {
      // Features del plan del coach
      whatsappSupport: editingPlan?.features?.whatsappSupport || false,
      communityAccess: editingPlan?.features?.communityAccess || false,
      progressTracking: editingPlan?.features?.progressTracking || false,
      leaderboardAccess: editingPlan?.features?.leaderboardAccess || false,
      timerAccess: editingPlan?.features?.timerAccess ?? true, // Por defecto true si el coach tiene timer
      personalizedWorkouts: editingPlan?.features?.personalizedWorkouts || false,
    },
  });

  if (!coachPlan) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <AlertCircle className="w-6 h-6 text-destructive mr-2" />
          <p>No se pudo cargar tu plan de coach</p>
        </CardContent>
      </Card>
    );
  }

  const coachFeatures = coachPlan.features;
  const maxPlans = coachPlan.maxStudentPlans || 2;
  const maxTier = coachPlan.maxStudentPlanTier || "basic";
  const planificationAccess = coachFeatures.planification_access;
  console.log(coachFeatures);
  // Verificar si puede crear más planes
  const canCreateMore = currentPlansCount < maxPlans;

  // Filtrar tiers disponibles según el plan del coach
  const availableTiers = TIER_OPTIONS.filter((tier) => {
    const tierLevels: Record<string, number> = {
      basic: 1,
      standard: 2,
      premium: 3,
      vip: 4,
    };
    return tierLevels[tier.value] <= tierLevels[maxTier];
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("El nombre del plan es requerido");
      return;
    }

    if (formData.price <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(
        err.message ||
          (isEditing
            ? "Error al actualizar el plan"
            : "Error al crear el plan"),
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = (
    key: keyof StudentPlanFormData["features"],
    value: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value,
      },
    }));
  };

  return (
    <div>
      {!canCreateMore && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">
                Has alcanzado el límite de planes
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tu plan {coachPlan.displayName} permite crear hasta {maxPlans}{" "}
                planes.
                {coachPlan.planName !== "elite" && (
                  <span className="block mt-1">
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <a href="/pricing/coaches">
                        Upgradea tu plan para crear más
                      </a>
                    </Button>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="space-y-4 mb-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Plan *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="text-sm placeholder:text-sm"
                placeholder="Ej: Plan Pro Mensual"
                disabled={!isEditing && !canCreateMore}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="10000"
                className="text-sm placeholder:text-sm"
                disabled={!isEditing && !canCreateMore}
              />
            </div>

            {/* <div className="space-y-2">
                <Label htmlFor="tier">Tipo de Plan *</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value) => setFormData({ ...formData, tier: value })}
                  disabled={!isEditing && !canCreateMore}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_OPTIONS.map((tier) => {
                      const isAvailable = availableTiers.some((t) => t.value === tier.value)
                      return (
                        <SelectItem
                          key={tier.value}
                          value={tier.value}
                          disabled={!isAvailable}
                        >
                          <div className="flex items-center gap-2">
                            <span>{tier.label}</span>
                            {!isAvailable && (
                              <span className="text-xs text-muted-foreground">
                                (Requiere upgrade)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tu plan {coachPlan.displayName} permite crear planes hasta &quot;{maxTier}&quot;
                </p>
              </div> */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe qué incluye este plan..."
              rows={3}
              className="border border-border bg-input text-sm placeholder:text-sm"
              disabled={!canCreateMore}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* <div className="space-y-2">
                <Label htmlFor="interval">Frecuencia *</Label>
                <Select
                  value={formData.interval}
                  onValueChange={(value) => setFormData({ ...formData, interval: value })}
                  disabled={!isEditing && !canCreateMore}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVALS.map((int) => (
                      <SelectItem key={int.value} value={int.value}>
                        {int.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div> */}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {planificationAccess === "weekly" &&
            "📅 Semanal - Los alumnos ven la semana actual"}
          {planificationAccess === "monthly" &&
            "📆 Mensual - Los alumnos ven todo el mes"}
          {planificationAccess === "unlimited" &&
            "♾️ Ilimitada - Los alumnos ven todo el historial"}
        </p>

        {/* Features Disponibles */}
        <div className="space-y-4">
          <h4 className="font-medium">Features disponibles</h4>
          <p className="text-sm text-muted-foreground">
            Solo puedes ofrecer lo que está incluido en tu plan{" "}
            {coachPlan.displayName}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp */}
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                !coachFeatures.whatsapp_integration && "opacity-50 bg-muted",
              )}
            >
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-xs text-muted-foreground">
                  {coachFeatures.whatsapp_integration
                    ? "Disponible en tu plan"
                    : "Requiere plan POWER o superior"}
                </p>
              </div>
              <Switch
                checked={formData.features.whatsappSupport}
                onCheckedChange={(v) => updateFeature("whatsappSupport", v)}
                disabled={!canCreateMore || !coachFeatures.whatsapp_integration}
              />
            </div>

            {/* Comunidad */}
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                !coachFeatures.community_forum && "opacity-50 bg-muted",
              )}
            >
              <div>
                <p className="font-medium">Comunidad</p>
                <p className="text-xs text-muted-foreground">
                  {coachFeatures.community_forum
                    ? "Disponible en tu plan"
                    : "Requiere plan POWER o superior"}
                </p>
              </div>
              <Switch
                checked={formData.features.communityAccess}
                onCheckedChange={(v) => updateFeature("communityAccess", v)}
                disabled={!canCreateMore || !coachFeatures.community_forum}
              />
            </div>

            {/* Progress Tracking */}
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                !coachFeatures.score_loading && "opacity-50 bg-muted",
              )}
            >
              <div>
                <p className="font-medium">Progreso</p>
                <p className="text-xs text-muted-foreground">
                  {coachFeatures.score_loading
                    ? "Disponible en tu plan"
                    : "Requiere plan POWER o superior"}
                </p>
              </div>
              <Switch
                checked={formData.features.progressTracking}
                onCheckedChange={(v) => updateFeature("progressTracking", v)}
                disabled={!canCreateMore || !coachFeatures.score_loading}
              />
            </div>

            {/* Leaderboard */}
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                !coachFeatures.score_database && "opacity-50 bg-muted",
              )}
            >
              <div>
                <p className="font-medium">Ranking</p>
                <p className="text-xs text-muted-foreground">
                  {coachFeatures.score_database
                    ? "Disponible en tu plan"
                    : "Requiere plan POWER o superior"}
                </p>
              </div>
              <Switch
                checked={formData.features.leaderboardAccess}
                onCheckedChange={(v) => updateFeature("leaderboardAccess", v)}
                disabled={!canCreateMore || !coachFeatures.score_database}
              />
            </div>

            {/* Cronómetro - Todos los planes */}
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                !coachFeatures.timer && "opacity-50 bg-muted",
              )}
            >
              <div>
                <p className="font-medium">Cronómetro</p>
                <p className="text-xs text-muted-foreground">
                  {coachFeatures.timer
                    ? "Los alumnos pueden usar el cronómetro"
                    : "No disponible en tu plan"}
                </p>
              </div>
              <Switch
                checked={formData.features.timerAccess}
                onCheckedChange={(v) => updateFeature("timerAccess", v)}
                disabled={!canCreateMore || !coachFeatures.timer}
              />
            </div>

            {/* Planificaciones Personalizadas */}
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                !coachFeatures.personalized_planifications && "opacity-50 bg-muted",
              )}
            >
              <div>
                <p className="font-medium">Planificaciones Personalizadas</p>
                <p className="text-xs text-muted-foreground">
                  {coachFeatures.personalized_planifications
                    ? "Puedes crear planes específicos por alumno"
                    : "Requiere plan ELITE"}
                </p>
              </div>
              <Switch
                checked={formData.features.personalizedWorkouts}
                onCheckedChange={(v) => updateFeature("personalizedWorkouts", v)}
                disabled={!canCreateMore || !coachFeatures.personalized_planifications}
              />
            </div>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || (!isEditing && !canCreateMore)}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Guardando..." : "Creando..."}
              </>
            ) : isEditing ? (
              "Guardar Cambios"
            ) : (
              "Crear Plan"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
