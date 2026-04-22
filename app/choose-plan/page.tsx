"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanSwitcher } from "@/components/subscription/plan-switcher";
import { useSubscriptionManagement } from "@/hooks/use-subscription-management";
import { Loader2 } from "lucide-react";

export default function ChoosePlanPage() {
  const router = useRouter();

  const {
    plans,
    loading,
    actionLoading,
    error,
    changePlan,
    loadPlans,
    loadCurrentSubscription,
  } = useSubscriptionManagement();

  if (loading) {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div
          className="absolute inset-0 kinetic-grid-bg pointer-events-none"
          aria-hidden="true"
        />
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">
            Cargando planes disponibles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-gradient-to-br from-background via-background to-card text-foreground">
      <div
        className="absolute inset-0 kinetic-grid-bg pointer-events-none"
        aria-hidden="true"
      />

      <main className="container mx-auto px-6 py-8 pb-16">
        {/* Header */}
        <div className="text-center mb-10 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-3xl uppercase md:text-4xl font-bold italic text-primary">
              Bienvenido
            </h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">
              Elegí tu plan de entrenamiento
            </h2>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            Seleccioná el plan que mejor se adapte a tus objetivos y empezá a
            entrenar con nosotros.
          </p>
        </div>

        {/* Planes */}
        {error ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-destructive font-medium">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await Promise.all([
                      loadPlans(),
                      loadCurrentSubscription(),
                    ]);
                  }}
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : plans.length > 0 ? (
          <PlanSwitcher
            currentPlanId=""
            plans={plans}
            onPlanSelect={changePlan}
            loading={actionLoading}
            showTitle={false}
            title="Elegí tu Plan"
            description="Seleccioná el plan que mejor se adapte a tus necesidades"
            confirmLabel="Ir a pagar"
          />
        ) : (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  No hay planes disponibles en este momento.
                </p>
                <p className="text-sm text-muted-foreground">
                  Por favor, contactá al administrador o intentá más tarde.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/")}
                >
                  Volver al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
