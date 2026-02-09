"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: any;
  is_active: boolean;
}

interface ChangePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    subscription?: {
      id: string;
      plan_id: string;
      current_period_end: string;
      plan: {
        id: string;
        name: string;
        price: number;
        currency: string;
        interval: string;
      };
    } | null;
  } | null;
  plans: SubscriptionPlan[];
  onChangePlan: (userId: string, newPlanId: string) => Promise<void>;
}

export function ChangePlanModal({
  open,
  onOpenChange,
  user,
  plans,
  onChangePlan,
}: ChangePlanModalProps) {
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [changing, setChanging] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedPlanId("");
    }
  }, [open]);

  // Normalizar comparación de IDs (pueden ser string o número)
  const selectedPlan = plans.find(
    (p) => String(p.id) === String(selectedPlanId),
  );
  const currentPlan = user?.subscription?.plan;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedPlanId) {
      toast({
        title: "Error de validación",
        description: "Por favor, selecciona un plan.",
        variant: "destructive",
      });
      return;
    }

    // No permitir cambiar al mismo plan
    if (String(selectedPlanId) === String(currentPlan?.id)) {
      toast({
        title: "Error de validación",
        description:
          "El usuario ya tiene este plan asignado. Selecciona un plan diferente.",
        variant: "destructive",
      });
      return;
    }

    const planToAssign = plans.find(
      (p) => String(p.id) === String(selectedPlanId),
    );

    if (!planToAssign) {
      toast({
        title: "Error de validación",
        description:
          "El plan seleccionado no es válido. Por favor, selecciona otro plan.",
        variant: "destructive",
      });
      return;
    }

    setChanging(true);
    try {
      await onChangePlan(user.id, selectedPlanId);
      toast({
        title: "Plan cambiado exitosamente",
        description: `El plan ha sido cambiado de "${currentPlan?.name}" a "${planToAssign.name}" para ${user.full_name || user.email}.`,
        variant: "default",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error al cambiar plan",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al cambiar el plan. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setChanging(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>Cambiar Plan de Suscripción</DialogTitle>
          <DialogDescription>
            Cambia el plan de {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan actual */}
          {currentPlan && (
            <div className="p-3 bg-muted/50 rounded-md space-y-1 border border-border">
              <p className="text-sm font-medium">Plan Actual:</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">
                  {currentPlan.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: currentPlan.currency,
                  }).format(currentPlan.price)}{" "}
                  / {currentPlan.interval === "month" ? "mes" : "año"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Período actual vence:{" "}
                {format(
                  new Date(user.subscription!.current_period_end),
                  "dd/MM/yyyy",
                  { locale: es },
                )}
              </p>
            </div>
          )}

          {/* Selección de Nuevo Plan */}
          <div className="space-y-2">
            <Label htmlFor="plan">Nuevo Plan *</Label>
            <Select
              value={selectedPlanId}
              onValueChange={setSelectedPlanId}
              required
            >
              <SelectTrigger id="plan">
                <SelectValue placeholder="Seleccionar nuevo plan" />
              </SelectTrigger>
              <SelectContent>
                {plans
                  .filter((plan) => plan.is_active)
                  .map((plan) => (
                    <SelectItem
                      key={String(plan.id)}
                      value={String(plan.id)}
                      disabled={String(plan.id) === String(currentPlan?.id)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {plan.name}
                          {String(plan.id) === String(currentPlan?.id) && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (actual)
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: plan.currency,
                          }).format(plan.price)}{" "}
                          / {plan.interval === "month" ? "mes" : "año"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedPlan && (
              <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                <p className="font-medium">{selectedPlan.name}</p>
                {selectedPlan.description && (
                  <p className="text-xs mt-1">{selectedPlan.description}</p>
                )}
                <p className="text-xs mt-1">
                  Precio:{" "}
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: selectedPlan.currency,
                  }).format(selectedPlan.price)}{" "}
                  / {selectedPlan.interval === "month" ? "mes" : "año"}
                </p>
              </div>
            )}
          </div>

          {/* Advertencia */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Importante:</p>
              <p>
                Al cambiar de plan, se cancelará la suscripción actual y se
                creará una nueva inmediatamente. El estudiante tendrá acceso al
                nuevo plan por 30 días desde hoy.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex max-sm:flex-col justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={changing}
              className="hover:scale-100 active:scale-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={changing || !selectedPlanId}
              className="hover:scale-100 active:scale-100"
            >
              {changing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cambiando...
                </>
              ) : (
                "Cambiar Plan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
