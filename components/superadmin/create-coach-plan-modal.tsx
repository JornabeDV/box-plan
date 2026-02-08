"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PredefinedFeaturesSection } from "./edit-plan/predefined-features-section";
import { CustomFeaturesSection } from "./edit-plan/custom-features-section";

interface CreateCoachPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DEFAULT_FEATURES = {
  dashboard_custom: false,
  weekly_planification: false,
  planification_weeks: 0,
  planification_monthly: false,
  planification_unlimited: false,
  max_disciplines: 0,
  timer: false,
  score_loading: false,
  score_database: false,
  mercadopago_connection: false,
  whatsapp_integration: false,
  community_forum: false,
  custom_motivational_quotes: false,
  personalized_planifications: false,
};

export function CreateCoachPlanModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCoachPlanModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    displayName: string;
    minStudents: number;
    maxStudents: number;
    basePrice: number;
    commissionRate: number;
    maxStudentPlans: number;
    features: Record<string, any>;
    isActive: boolean;
  }>({
    name: "",
    displayName: "",
    minStudents: 0,
    maxStudents: 999999,
    basePrice: 0,
    commissionRate: 0,
    maxStudentPlans: 2,
    features: { ...DEFAULT_FEATURES },
    isActive: true,
  });

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateFeature = (feature: string, value: boolean | number | string) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value,
      },
    }));
  };

  const removeFeature = (feature: string) => {
    setFormData((prev) => {
      const newFeatures: Record<string, any> = { ...prev.features };
      delete newFeatures[feature];
      return {
        ...prev,
        features: newFeatures,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.displayName) {
      toast({
        title: "Error",
        description:
          "El nombre interno y el nombre para mostrar son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/superadmin/coach-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.toLowerCase().replace(/\s+/g, "_"),
          displayName: formData.displayName,
          minStudents: formData.minStudents,
          maxStudents: formData.maxStudents,
          basePrice: formData.basePrice,
          commissionRate: formData.commissionRate,
          maxStudentPlans: formData.maxStudentPlans,
          features: formData.features,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear plan");
      }

      toast({
        title: "Éxito",
        description: "Plan creado correctamente",
      });

      // Reset form
      setFormData({
        name: "",
        displayName: "",
        minStudents: 0,
        maxStudents: 999999,
        basePrice: 0,
        commissionRate: 0,
        maxStudentPlans: 2,
        features: { ...DEFAULT_FEATURES },
        isActive: true,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating plan:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Plan</DialogTitle>
          <DialogDescription>
            Crea un nuevo plan para coaches con sus características y precios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Información Básica</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Interno (ID)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="ej: start, power, elite"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Identificador único, sin espacios
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre para Mostrar</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => updateField("displayName", e.target.value)}
                  placeholder="ej: Plan Start"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Precio Base</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) =>
                    updateField("basePrice", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Comisión (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commissionRate}
                  onChange={(e) =>
                    updateField(
                      "commissionRate",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minStudents">Estudiantes Mínimos</Label>
                <Input
                  id="minStudents"
                  type="number"
                  value={formData.minStudents}
                  onChange={(e) =>
                    updateField("minStudents", parseInt(e.target.value) || 0)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStudents">Estudiantes Máximos</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  value={
                    formData.maxStudents === 999999 ? "" : formData.maxStudents
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value || value === "") {
                      updateField("maxStudents", 999999);
                    } else {
                      updateField("maxStudents", parseInt(value) || 999999);
                    }
                  }}
                  placeholder="Dejar vacío para ilimitado"
                />
                <p className="text-xs text-muted-foreground">
                  Dejar vacío para ilimitado
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => updateField("isActive", checked)}
              />
              <Label htmlFor="isActive">Plan Activo</Label>
            </div>
          </div>

          {/* Predefined Features */}
          <PredefinedFeaturesSection
            features={formData.features}
            onFeatureChange={updateFeature}
          />

          {/* Custom Features */}
          <CustomFeaturesSection
            features={formData.features}
            onFeatureChange={updateFeature}
            onFeatureRemove={removeFeature}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Plan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
