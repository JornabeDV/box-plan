"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { StudentPlansList } from "./student-plans-list";
import { StudentPlanForm, type StudentPlanFormData } from "./student-plan-form";
import { useCoachPlanFeatures } from "@/hooks/use-coach-plan-features";
import { Loader2 } from "lucide-react";

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
  _count?: {
    subscriptions: number;
  };
}

export function StudentPlansManager() {
  console.log("StudentPlansManager RENDER");
  const {
    planInfo,
    loading: planLoading,
    maxStudentPlans,
  } = useCoachPlanFeatures();
  const [plans, setPlans] = useState<StudentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudentPlan | null>(null);

  console.log("planInfo:", planInfo);
  console.log("planLoading:", planLoading);

  // Cargar planes existentes
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch("/api/subscription-plans");
      console.log("API Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("API Data:", data);
        setPlans(data);
      } else {
        console.error("API Error:", await response.text());
      }
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (formData: StudentPlanFormData) => {
    try {
      const response = await fetch("/api/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Error al crear el plan");
      }

      toast({
        title: "Plan creado exitosamente",
        description: `Has creado "${formData.name}". Te quedan ${data.remainingPlans} planes disponibles.`,
      });

      setShowForm(false);
      loadPlans(); // Recargar lista
    } catch (error: any) {
      toast({
        title: "Error al crear el plan",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleEditPlan = async (formData: StudentPlanFormData) => {
    if (!editingPlan) return;

    try {
      const response = await fetch(
        `/api/subscription-plans/${editingPlan.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Error al actualizar el plan",
        );
      }

      toast({
        title: "Plan actualizado exitosamente",
        description: `Has actualizado "${formData.name}".`,
      });

      setShowForm(false);
      setEditingPlan(null);
      loadPlans(); // Recargar lista
    } catch (error: any) {
      toast({
        title: "Error al actualizar el plan",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleOpenEdit = (plan: StudentPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = async (plan: StudentPlan) => {
    try {
      const response = await fetch(`/api/subscription-plans/${plan.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Error al eliminar el plan",
        );
      }

      toast({
        title: "Plan eliminado",
        description: `El plan "${plan.name}" ha sido eliminado exitosamente.`,
      });

      loadPlans(); // Recargar lista
    } catch (error: any) {
      toast({
        title: "Error al eliminar el plan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (planLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planes para Alumnos</h2>
          <p className="text-muted-foreground">
            Crea y gestiona los planes de suscripción que ofreces a tus alumnos
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={plans.length >= maxStudentPlans}
        >
          Crear Nuevo Plan
        </Button>
      </div>

      <StudentPlansList
        plans={plans}
        coachPlan={planInfo}
        onCreatePlan={() => setShowForm(true)}
        onEditPlan={handleOpenEdit}
        onDeletePlan={handleDeletePlan}
        loading={loading}
      />

      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Editar Plan" : "Crear Plan para Alumnos"}
            </DialogTitle>
          </DialogHeader>
          <StudentPlanForm
            coachPlan={planInfo}
            currentPlansCount={plans.length}
            editingPlan={editingPlan}
            onSubmit={editingPlan ? handleEditPlan : handleCreatePlan}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
