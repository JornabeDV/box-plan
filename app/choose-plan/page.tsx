"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanSwitcher } from "@/components/subscription/plan-switcher";
import { useSubscriptionManagement } from "@/hooks/use-subscription-management";
import { Loader2, MessageCircle, User, Star, Check } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

function formatPhoneForWhatsApp(phoneNumber: string): string {
  let cleaned = phoneNumber.replace(/[^\d+]/g, "");

  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("54")) {
      cleaned = "+" + cleaned;
    } else {
      cleaned = "+54" + cleaned;
    }
  }

  return cleaned.replace(/\+/g, "");
}

function PersonalizedPlanCard({
  coachName,
  coachBusinessName,
  phone,
}: {
  coachName: string | null;
  coachBusinessName: string | null;
  phone: string | null;
}) {
  const handleWhatsAppClick = () => {
    if (!phone) return;
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = encodeURIComponent(
      `Hola ${coachBusinessName || coachName || ""}, te contacto desde BoxPlan. ` +
        `Me interesa contratar un plan personalizado. ¿Podemos coordinar?`
    );
    window.open(
      `https://wa.me/${formattedPhone}?text=${message}`,
      "_blank"
    );
  };

  return (
    <Card className="relative flex flex-col transition-all duration-300 hover:shadow-lg cursor-pointer">
      <div className="p-6 flex flex-col flex-1 text-center">
        <div className="flex items-center justify-center mb-3 min-h-[28px]">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            <Star className="w-3 h-3 mr-1" />
            A tu medida
          </Badge>
        </div>
        <div className="mb-4">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <User className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold mb-2">Plan Personalizado</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-6">
          Entrenamiento adaptado a tus objetivos, disponibilidad y nivel. Habla
          directamente con {coachBusinessName || coachName || "tu coach"} para
          armar tu plan a medida.
        </p>

        <ul className="space-y-2 md:space-y-3 mb-6 flex-1 text-left">
          <li className="flex items-start">
            <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-xs md:text-sm text-muted-foreground">
              Evaluación de tus objetivos y nivel actual
            </span>
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-xs md:text-sm text-muted-foreground">
              Planificación ajustada a tu rutina
            </span>
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-xs md:text-sm text-muted-foreground">
              Seguimiento directo con el coach
            </span>
          </li>
        </ul>

        {phone ? (
          <Button
            onClick={handleWhatsAppClick}
            className="w-full mt-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            size="default"
          >
            <MessageCircle className="w-4 h-4 md:mr-2" />
            Contactar por WhatsApp
          </Button>
        ) : (
          <Button disabled className="w-full mt-auto" size="lg">
            Contacto no disponible
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function ChoosePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedPlanId = searchParams.get("plan");

  const {
    plans,
    sharedPlan,
    loading,
    actionLoading,
    error,
    changePlan,
    loadPlans,
    loadCurrentSubscription,
  } = useSubscriptionManagement(sharedPlanId || undefined);

  const [showSharedPlanMessage, setShowSharedPlanMessage] = useState(false);

  // En la vista pública nunca mostramos planes personalizados reales;
  // solo se muestran cuando se accede mediante un link compartido (?plan=TOKEN).
  const displayPlans = useMemo(() => {
    if (sharedPlanId && sharedPlan) return [sharedPlan]
    if (sharedPlanId && !sharedPlan) return []
    return plans.filter((p: any) => !p.is_personalized)
  }, [sharedPlanId, sharedPlan, plans])

  const coachFromPlans = useMemo(() => {
    const planWithCoach = displayPlans.find((p: any) => p.coach)
    return planWithCoach?.coach || sharedPlan?.coach || null
  }, [displayPlans, sharedPlan])

  useEffect(() => {
    if (sharedPlanId) {
      setShowSharedPlanMessage(true);
    }
  }, [sharedPlanId]);

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
              {sharedPlanId && sharedPlan
                ? "Plan personalizado para vos"
                : "Elegí tu plan de entrenamiento"}
            </h2>
          </div>
          {(!sharedPlanId || !sharedPlan) && (
            <p className="text-muted-foreground max-w-md mx-auto">
              Seleccioná el plan que mejor se adapte a tus objetivos y empezá a
              entrenar con nosotros.
            </p>
          )}
          {showSharedPlanMessage && sharedPlan && (
            <p className="text-sm sm:text-base text-purple-600 font-medium">
              Estás viendo un plan personalizado compartido por{" "}
              {sharedPlan.coach?.businessName || sharedPlan.coach?.user?.name || "tu coach"}.
            </p>
          )}
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
        ) : displayPlans.length > 0 || coachFromPlans ? (
          <PlanSwitcher
            currentPlanId=""
            plans={displayPlans}
            onPlanSelect={changePlan}
            loading={actionLoading}
            showTitle={false}
            title="Elegí tu Plan"
            description="Seleccioná el plan que mejor se adapte a tus necesidades"
            confirmLabel="Ir a pagar"
            extraCard={
              !sharedPlanId && coachFromPlans ? (
                <PersonalizedPlanCard
                  coachName={coachFromPlans.businessName || coachFromPlans.user?.name || null}
                  coachBusinessName={coachFromPlans.businessName}
                  phone={coachFromPlans.phone}
                />
              ) : null
            }
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
