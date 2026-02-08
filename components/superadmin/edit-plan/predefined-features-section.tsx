"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PredefinedFeaturesSectionProps {
  features: Record<string, any>;
  onFeatureChange: (feature: string, value: boolean | number | string) => void;
}

const BOOLEAN_FEATURES = [
  { key: "dashboard_custom", label: "Dashboard Personalizado" },
  { key: "personalized_planifications", label: "Planificaciones Personalizadas" },
  { key: "replicate_planifications", label: "Duplicar/Replicar Planificaciones" },
  { key: "score_loading", label: "Carga de Scores" },
  { key: "score_database", label: "Base de Datos de Scores" },
  { key: "mercadopago_connection", label: "Conexión MercadoPago" },
  { key: "whatsapp_integration", label: "Integración WhatsApp" },
  { key: "community_forum", label: "Foro de Comunidad" },
  { key: "timer", label: "Cronómetro" },
];

const PLANIFICATION_OPTIONS = [
  { value: "weekly", label: "Semanal", description: "Solo la semana actual" },
  { value: "monthly", label: "Mensual", description: "Todo el mes actual" },
  {
    value: "unlimited",
    label: "Ilimitada",
    description: "Acceso histórico completo",
  },
];

export function PredefinedFeaturesSection({
  features,
  onFeatureChange,
}: PredefinedFeaturesSectionProps) {
  // Obtener el valor actual de planificación (nuevo o legacy)
  const getPlanificationAccess = (): string => {
    if (features.planification_access) {
      return features.planification_access;
    }
    // Mapear desde valores legacy (daily se convierte a weekly)
    if (features.planification_unlimited) return "unlimited";
    if (features.planification_monthly) return "monthly";
    return "weekly";
  };

  const handlePlanificationChange = (value: string) => {
    // Guardar el nuevo campo
    onFeatureChange("planification_access", value);

    // También actualizar los campos legacy para compatibilidad
    onFeatureChange("weekly_planification", value === "weekly");
    onFeatureChange("planification_monthly", value === "monthly");
    onFeatureChange("planification_unlimited", value === "unlimited");
    onFeatureChange("planification_weeks", value === "weekly" ? 1 : 0);
  };

  const currentAccess = getPlanificationAccess();

  return (
    <div className="space-y-4 border-t pt-4">
      <Label className="text-base font-semibold">Características</Label>

      {/* Selector de tipo de planificación */}
      <div className="space-y-2 bg-muted/50 p-4 rounded-lg border border-border">
        <Label htmlFor="planification_access" className="font-medium">
          Acceso a calendario para planificar
        </Label>
        <Select value={currentAccess} onValueChange={handlePlanificationChange}>
          <SelectTrigger id="planification_access" className="w-full">
            <SelectValue placeholder="Selecciona el tipo de acceso" />
          </SelectTrigger>
          <SelectContent>
            {PLANIFICATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col items-start">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Features booleanas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BOOLEAN_FEATURES.map((feature) => (
          <div key={feature.key} className="flex items-center justify-between">
            <Label htmlFor={feature.key}>{feature.label}</Label>
            <Switch
              id={feature.key}
              checked={features[feature.key] || false}
              onCheckedChange={(checked) =>
                onFeatureChange(feature.key, checked)
              }
            />
          </div>
        ))}
      </div>

      {/* Características numéricas */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="max_disciplines">Máximo de Disciplinas</Label>
          <Input
            id="max_disciplines"
            type="number"
            value={
              features.max_disciplines === 999999
                ? ""
                : features.max_disciplines || 0
            }
            onChange={(e) => {
              const value = e.target.value;
              if (!value || value === "") {
                onFeatureChange("max_disciplines", 0);
              } else if (value === "999999" || parseInt(value) >= 999999) {
                onFeatureChange("max_disciplines", 999999);
              } else {
                onFeatureChange("max_disciplines", parseInt(value) || 0);
              }
            }}
            placeholder="999999 para ilimitadas"
          />
          <p className="text-xs text-muted-foreground">
            Ingresa 999999 para disciplinas ilimitadas
          </p>
        </div>
      </div>
    </div>
  );
}
