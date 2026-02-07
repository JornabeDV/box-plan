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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChangePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coach: any;
  onSuccess: () => void;
}

export function ChangePlanModal({
  open,
  onOpenChange,
  coach,
  onSuccess,
}: ChangePlanModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchPlans();
      // Establecer valores por defecto
      setSelectedPlanId(coach?.plan?.id?.toString() || "");
      if (coach?.subscription) {
        setStartDate(coach.subscription.currentPeriodStart.split("T")[0]);
        setEndDate(coach.subscription.currentPeriodEnd.split("T")[0]);
      } else {
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setStartDate(today.toISOString().split("T")[0]);
        setEndDate(nextMonth.toISOString().split("T")[0]);
      }
    }
  }, [open, coach]);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/coaches/plans");
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlanId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un plan",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/superadmin/coaches/${coach.id}/plan`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          startDate,
          endDate,
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cambiar Plan del Coach</DialogTitle>
          <DialogDescription>
            Actualiza el plan de suscripción para{" "}
            {coach?.businessName || coach?.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {plans.map((plan) => (
                  <SelectItem
                    key={plan.id}
                    value={plan.id.toString()}
                    className="w-full"
                  >
                    {plan.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="text-sm placeholder:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="text-sm placeholder:text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Actualizar Plan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
