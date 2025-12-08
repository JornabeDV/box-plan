"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionPlanModal } from "@/components/admin/subscription-plan-modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  useSubscriptionPlans,
  SubscriptionPlan as PlanType,
} from "@/hooks/use-subscription-plans";
import { Plus, Edit, Trash2, DollarSign, Calendar } from "lucide-react";

interface SubscriptionPlansListProps {
  initialPlans?: any[];
  onRefresh?: () => void;
}

export function SubscriptionPlansList({
  initialPlans,
  onRefresh,
}: SubscriptionPlansListProps = {}) {
  const {
    plans: hookPlans,
    loading,
    deletePlan,
    updateTrigger,
  } = useSubscriptionPlans();

  // Usar datos iniciales si están disponibles, sino usar los del hook
  const plans = initialPlans || hookPlans;
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PlanType | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estado local para forzar re-render cuando cambian los planes
  const [displayPlans, setDisplayPlans] = useState<PlanType[]>([]);

  // Actualizar planes de visualización cuando cambian los planes o el trigger
  useEffect(() => {
    const updatedPlans = plans.map((plan) => ({
      ...plan,
      price: Number(plan.price),
    }));
    setDisplayPlans(updatedPlans);
  }, [plans, updateTrigger]);

  // Memoizar planes con dependencia en updateTrigger para forzar re-render
  const memoizedPlans = useMemo(() => {
    return displayPlans;
  }, [displayPlans]);

  // Actualizar el plan seleccionado cuando los planes cambian
  useEffect(() => {
    if (selectedPlan) {
      const updatedPlan = memoizedPlans.find((p) => p.id === selectedPlan.id);
      if (
        updatedPlan &&
        (updatedPlan.price !== selectedPlan.price ||
          updatedPlan.name !== selectedPlan.name ||
          updatedPlan.description !== selectedPlan.description ||
          updatedPlan.currency !== selectedPlan.currency ||
          updatedPlan.interval !== selectedPlan.interval ||
          updatedPlan.is_active !== selectedPlan.is_active)
      ) {
        setSelectedPlan(updatedPlan);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedPlans, updateTrigger]);

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setShowModal(true);
  };

  const handleEditPlan = (plan: PlanType) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleDeletePlan = (plan: PlanType) => {
    setPlanToDelete(plan);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    setDeleting(true);
    const result = await deletePlan(planToDelete.id);
    setDeleting(false);

    if (result.success) {
      setShowDeleteDialog(false);
      setPlanToDelete(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  // Solo mostrar loading si no hay datos iniciales y está cargando
  if (!initialPlans && loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando planes...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold">Planes de Suscripción</h2>
            <p className="text-muted-foreground">
              Gestiona los planes de suscripción disponibles para los usuarios
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button onClick={handleCreatePlan} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Crear Plan
            </Button>
          </div>
        </div>

        {/* Lista de planes */}
        {memoizedPlans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No hay planes de suscripción creados
              </p>
              <Button onClick={handleCreatePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {memoizedPlans.map((plan) => (
              <Card
                key={`${plan.id}-${plan.price}-${
                  plan.updated_at || plan.created_at
                }-${updateTrigger}`}
                className="relative flex flex-col h-full"
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {plan.description || "Sin descripción"}
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0">
                      {plan.is_active ? (
                        <Badge variant="default" className="sm:ml-2">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="sm:ml-2">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <div className="flex flex-col flex-1 space-y-4">
                    {/* Precio */}
                    <div
                      className="flex flex-wrap items-center gap-2"
                      key={`price-${plan.id}-${plan.price}-${updateTrigger}`}
                    >
                      <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span
                        className="text-2xl font-bold"
                        key={`price-value-${plan.id}-${plan.price}-${updateTrigger}`}
                      >
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground capitalize">
                          {plan.interval}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    {plan.features &&
                      Array.isArray(plan.features) &&
                      plan.features.length > 0 && (
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-2">
                            Características:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {plan.features
                              .slice(0, 3)
                              .map((feature: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            {plan.features.length > 3 && (
                              <li className="text-xs text-muted-foreground">
                                +{plan.features.length - 3} más
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                    {/* Acciones - Siempre al final */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePlan(plan)}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de crear/editar plan */}
      <SubscriptionPlanModal
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            // Limpiar el plan seleccionado cuando se cierra el modal
            setSelectedPlan(null);
          }
        }}
        plan={selectedPlan}
        onPlanUpdated={onRefresh}
      />

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
        description={`¿Estás seguro de que quieres eliminar el plan "${planToDelete?.name}"? Esta acción desactivará el plan y los usuarios no podrán seleccionarlo.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleting}
      />
    </>
  );
}
