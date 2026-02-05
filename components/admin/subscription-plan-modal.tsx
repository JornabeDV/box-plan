"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useSubscriptionPlans,
  SubscriptionPlan,
} from "@/hooks/use-subscription-plans";
import { Plus, X } from "lucide-react";

interface SubscriptionPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: SubscriptionPlan | null;
  onPlanUpdated?: () => void;
}

export function SubscriptionPlanModal({
  open,
  onOpenChange,
  plan,
  onPlanUpdated,
}: SubscriptionPlanModalProps) {
  const { createPlan, updatePlan } = useSubscriptionPlans();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "ARS",
    interval: "month",
    features: [] as string[],
    is_active: true,
  });

  const [newFeature, setNewFeature] = useState("");

  // Reset form when modal opens/closes or plan changes
  useEffect(() => {
    if (open) {
      if (plan) {
        setFormData({
          name: plan.name,
          description: plan.description || "",
          price: plan.price.toString(),
          currency: plan.currency,
          interval: plan.interval,
          features: Array.isArray(plan.features) ? plan.features : [],
          is_active: plan.is_active,
        });
      } else {
        setFormData({
          name: "",
          description: "",
          price: "",
          currency: "ARS",
          interval: "month",
          features: [],
          is_active: true,
        });
      }
      setNewFeature("");
    }
  }, [
    open,
    plan?.id,
    plan?.price,
    plan?.name,
    plan?.description,
    plan?.currency,
    plan?.interval,
    plan?.is_active,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      return;
    }

    setLoading(true);

    try {
      const planData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        currency: formData.currency,
        interval: formData.interval,
        features: formData.features,
        is_active: formData.is_active,
      };

      let result;
      if (plan) {
        result = await updatePlan(plan.id, planData);
      } else {
        result = await createPlan(planData);
      }

      if (result.success) {
        // El estado ya se actualizó en updatePlan, solo cerrar el modal
        onOpenChange(false);
        if (onPlanUpdated) {
          onPlanUpdated();
        }
      }
    } catch (error) {
      console.error("Error saving plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar Plan" : "Crear Plan"}</DialogTitle>
          <DialogDescription>
            {plan
              ? "Modifica los detalles del plan de suscripción"
              : "Crea un nuevo plan de suscripción"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ej: Básico, Intermedio, Pro"
              className="text-sm md:text-base placeholder:text-sm md:placeholder:text-base"
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descripción del plan"
              className="text-sm md:text-base placeholder:text-sm md:placeholder:text-base border border-color bg-input"
              rows={3}
            />
          </div>

          {/* Precio y Moneda */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="25000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Intervalo */}
          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo *</Label>
            <Select
              value={formData.interval}
              onValueChange={(value) =>
                setFormData({ ...formData, interval: value })
              }
            >
              <SelectTrigger id="interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mensual</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Características */}
          <div className="space-y-2">
            <Label>Características</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Agregar característica..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="text-sm md:text-base placeholder:text-sm md:placeholder:text-base h-auto"
              />
              <Button
                type="button"
                onClick={handleAddFeature}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.features.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-muted px-2 rounded border border-color bg-input"
                  >
                    <span className="flex-1 text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estado Activo */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Plan Activo</Label>
              <p className="text-sm text-muted-foreground">
                Los planes inactivos no estarán disponibles para nuevos usuarios
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : plan ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
