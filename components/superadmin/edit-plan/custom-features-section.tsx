"use client";

import { Label } from "@/components/ui/label";
import { CustomFeatureItem } from "./custom-feature-item";
import { AddCustomFeatureForm } from "./add-custom-feature-form";

const PREDEFINED_FEATURES = [
  "dashboard_custom",
  "daily_planification",
  "planification_monthly",
  "planification_unlimited",
  "score_loading",
  "score_database",
  "mercadopago_connection",
  "whatsapp_integration",
  "community_forum",
  "timer",
  "planification_weeks",
  "max_disciplines",
];

interface CustomFeaturesSectionProps {
  features: Record<string, any>;
  onFeatureChange: (feature: string, value: boolean | number | string) => void;
  onFeatureRemove: (feature: string) => void;
}

function getFeatureType(value: any): "boolean" | "number" | "string" {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

export function CustomFeaturesSection({
  features,
  onFeatureChange,
  onFeatureRemove,
}: CustomFeaturesSectionProps) {
  const customFeatures = Object.keys(features).filter(
    (key) => !PREDEFINED_FEATURES.includes(key)
  );

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Características Personalizadas
        </Label>
      </div>

      {customFeatures.length > 0 && (
        <div className="space-y-2">
          {customFeatures.map((featureKey) => {
            const value = features[featureKey];
            const type = getFeatureType(value);
            return (
              <CustomFeatureItem
                key={featureKey}
                featureKey={featureKey}
                value={value}
                type={type}
                onValueChange={(newValue) =>
                  onFeatureChange(featureKey, newValue)
                }
                onRemove={() => onFeatureRemove(featureKey)}
              />
            );
          })}
        </div>
      )}

      <AddCustomFeatureForm
        onAdd={(key, value) => onFeatureChange(key, value)}
        existingKeys={Object.keys(features)}
      />
    </div>
  );
}
