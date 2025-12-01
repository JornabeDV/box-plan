"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface PredefinedFeaturesSectionProps {
  features: Record<string, any>;
  onFeatureChange: (feature: string, value: boolean | number | string) => void;
}

const BOOLEAN_FEATURES = [
  { key: "dashboard_custom", label: "Dashboard Personalizado" },
  { key: "daily_planification", label: "Planificación Diaria" },
  { key: "planification_monthly", label: "Planificación Mensual" },
  { key: "planification_unlimited", label: "Planificación Ilimitada" },
  { key: "score_loading", label: "Carga de Scores" },
  { key: "score_database", label: "Base de Datos de Scores" },
  { key: "mercadopago_connection", label: "Conexión MercadoPago" },
  { key: "virtual_wallet", label: "Billetera Virtual" },
  { key: "whatsapp_integration", label: "Integración WhatsApp" },
  { key: "community_forum", label: "Foro de Comunidad" },
  { key: "timer", label: "Cronómetro" },
];

export function PredefinedFeaturesSection({
  features,
  onFeatureChange,
}: PredefinedFeaturesSectionProps) {
  return (
    <div className="space-y-4 border-t pt-4">
      <Label className="text-base font-semibold">Características</Label>

      <div className="grid grid-cols-2 gap-4">
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
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="planification_weeks">Semanas de Planificación</Label>
          <Input
            id="planification_weeks"
            type="number"
            value={features.planification_weeks || 0}
            onChange={(e) =>
              onFeatureChange(
                "planification_weeks",
                parseInt(e.target.value) || 0
              )
            }
            placeholder="0 si no aplica"
          />
        </div>
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
