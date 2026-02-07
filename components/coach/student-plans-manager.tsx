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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

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
  const {
    planInfo,
    loading: planLoading,
    maxStudentPlans,
  } = useCoachPlanFeatures();
  const [plans, setPlans] = useState<StudentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudentPlan | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<StudentPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar planes existentes
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch("/api/subscription-plans");
      if (response.ok) {
        const data = await response.json();
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

  const handleDeletePlan = (plan: StudentPlan) => {
    setPlanToDelete(plan);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/subscription-plans/${planToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Error al eliminar el plan",
        );
      }

      toast({
        title: "Plan eliminado",
        description: `El plan "${planToDelete.name}" ha sido eliminado exitosamente.`,
      });

      setShowDeleteDialog(false);
      setPlanToDelete(null);
      loadPlans(); // Recargar lista
    } catch (error: any) {
      toast({
        title: "Error al eliminar el plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (planLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filtrar solo planes activos para el conteo y visualización
  const activePlans = plans.filter((plan) => plan.isActive);
  const activePlansCount = activePlans.length;

  return (
    <div className="space-y-6">
      <div className="flex max-sm:flex-col items-center justify-between gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Planes para alumnos</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Crea y gestiona los planes de suscripción que ofreces a tus alumnos
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={activePlansCount >= maxStudentPlans}
          className="max-sm:w-full"
        >
          Crear Nuevo Plan
        </Button>
      </div>

      <StudentPlansList
        plans={activePlans}
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
            currentPlansCount={activePlansCount}
            editingPlan={editingPlan}
            onSubmit={editingPlan ? handleEditPlan : handleCreatePlan}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!deleting) {
            setShowDeleteDialog(open);
          }
        }}
        onConfirm={confirmDelete}
        title="Eliminar Plan"
        description={`¿Estás seguro de que quieres eliminar el plan "${planToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
}
