"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, Settings } from "lucide-react";
import { EditCoachPlanModal } from "./edit-coach-plan-modal";
import { useToast } from "@/hooks/use-toast";

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

interface CoachPlansListProps {
  plans: CoachPlan[];
  loading: boolean;
  onRefresh: () => void;
}

export function CoachPlansList({
  plans,
  loading,
  onRefresh,
}: CoachPlansListProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<CoachPlan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditPlan = (plan: CoachPlan) => {
    setSelectedPlan(plan);
    setShowEditModal(true);
  };

  const handlePlanUpdated = () => {
    setShowEditModal(false);
    setSelectedPlan(null);
    onRefresh();
    toast({
      title: "Plan actualizado",
      description: "El plan ha sido actualizado exitosamente",
    });
  };

  const getPlanBadgeColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "start":
        return "bg-blue-500";
      case "power":
        return "bg-purple-500";
      case "elite":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay planes</h3>
          <p className="text-muted-foreground">
            No se encontraron planes de coaches.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                  <Badge className={getPlanBadgeColor(plan.name)}>
                    {plan.name.toUpperCase()}
                  </Badge>
                  {plan.isActive ? (
                    <Badge className="bg-green-500">Activo</Badge>
                  ) : (
                    <Badge variant="outline">Inactivo</Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditPlan(plan)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Estudiantes
                </div>
                <div className="text-sm">
                  {plan.minStudents === plan.maxStudents
                    ? plan.maxStudents === 999999
                      ? "Ilimitados"
                      : plan.maxStudents
                    : `${plan.minStudents} - ${
                        plan.maxStudents === 999999
                          ? "Ilimitados"
                          : plan.maxStudents
                      }`}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Precio Base
                </div>
                <div className="text-sm font-semibold">
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  }).format(plan.basePrice)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Comisión
                </div>
                <div className="text-sm font-semibold">
                  {plan.commissionRate}%
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Características
                </div>
                <div className="text-sm">
                  {plan.features && typeof plan.features === "object"
                    ? Object.keys(plan.features).filter(
                        (key) => plan.features[key] === true
                      ).length
                    : 0}{" "}
                  activas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Modal para editar plan */}
      {showEditModal && selectedPlan && (
        <EditCoachPlanModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          plan={selectedPlan}
          onSuccess={handlePlanUpdated}
        />
      )}
    </div>
  );
}
