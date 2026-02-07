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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PlanBasicInfoForm } from "./edit-plan/plan-basic-info-form";
import { PredefinedFeaturesSection } from "./edit-plan/predefined-features-section";
import { CustomFeaturesSection } from "./edit-plan/custom-features-section";
import { usePlanForm } from "./edit-plan/use-plan-form";

interface CoachPlan {
  id: number;
  name: string;
  displayName: string;
  minStudents: number;
  maxStudents: number;
  basePrice: number;
  commissionRate: number;
  features: any;
  isActive: boolean;
}

interface EditCoachPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: CoachPlan;
  onSuccess: () => void;
}

export function EditCoachPlanModal({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: EditCoachPlanModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { formData, updateField, updateFeature, removeFeature } = usePlanForm(
    plan,
    open
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await fetch(`/api/superadmin/coach-plans/${plan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          minStudents: formData.minStudents,
          maxStudents: formData.maxStudents,
          basePrice: formData.basePrice,
          commissionRate: formData.commissionRate,
          features: formData.features,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar plan");
      }

      toast({
        title: "Éxito",
        description: "Plan actualizado correctamente",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al actualizar plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Plan: {plan.displayName}</DialogTitle>
          <DialogDescription>
            Actualiza la información del plan de coach
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información básica */}
          <PlanBasicInfoForm
            displayName={formData.displayName}
            basePrice={formData.basePrice}
            minStudents={formData.minStudents}
            maxStudents={formData.maxStudents}
            commissionRate={formData.commissionRate}
            onChange={updateField}
          />

          {/* Características predefinidas */}
          <PredefinedFeaturesSection
            features={formData.features}
            onFeatureChange={updateFeature}
          />

          {/* Características personalizadas */}
          <CustomFeaturesSection
            features={formData.features}
            onFeatureChange={updateFeature}
            onFeatureRemove={removeFeature}
          />

          {/* Estado activo */}
          <div className="flex items-center justify-between border-t pt-4">
            <Label htmlFor="isActive">Plan Activo</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
