"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserCoach } from "@/hooks/use-user-coach";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import {
  AlertTriangle,
  CreditCard,
  MessageCircle,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";

function getWhatsAppUrl(
  phone: string | null | undefined,
  coachName: string
): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    cleaned = cleaned.startsWith("54") ? "+" + cleaned : "+54" + cleaned;
  }
  const message = `Hola ${coachName}, mi suscripción en BoxPlan venció. ¿Podrías ayudarme a renovarla?`;
  return `https://wa.me/${cleaned.replace(/\+/g, "")}?text=${encodeURIComponent(message)}`;
}

export default function SubscriptionExpiredPage() {
  const router = useRouter();
  const { coach: userCoach, loading: coachLoading } = useUserCoach();
  const {
    subscription,
    isExpired,
    loading: subscriptionLoading,
  } = useStudentSubscription();

  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirigir a la pantalla principal si el usuario ya tiene una suscripción activa
  useEffect(() => {
    if (subscriptionLoading || coachLoading) return;

    if (subscription && !isExpired) {
      setIsRedirecting(true);
      router.replace("/");
    }
  }, [subscriptionLoading, coachLoading, subscription, isExpired, router]);

  // Limpiar cache de suscripción para forzar datos frescos en la próxima carga
  useEffect(() => {
    if (typeof window !== "undefined") {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("student_subscription_"))
        .forEach((key) => localStorage.removeItem(key));
    }
  }, []);

  // Animación escalonada
  useEffect(() => {
    if (coachLoading || subscriptionLoading) return;

    const timers: NodeJS.Timeout[] = [];
    [0, 1, 2, 3].forEach((i) => {
      timers.push(
        setTimeout(() => {
          setVisibleItems((prev) => Math.max(prev, i + 1));
        }, i * 180)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [coachLoading, subscriptionLoading]);

  const coachName = userCoach?.name || userCoach?.businessName || "Tu coach";
  const coachPhone = userCoach?.phone;
  const whatsappUrl = getWhatsAppUrl(coachPhone, coachName);

  const expiredDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  if (subscriptionLoading || coachLoading || isRedirecting) {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground flex items-center justify-center">
        <div
          className="absolute inset-0 kinetic-grid-bg pointer-events-none"
          aria-hidden="true"
        />
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 kinetic-grid-bg pointer-events-none"
        aria-hidden="true"
      />

      <main className="px-5 py-8 pb-12 max-w-md mx-auto flex flex-col min-h-[100dvh]">
        {/* Header */}
        <div className="text-center space-y-4 pt-4">
          <div
            className={`w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto transition-all duration-700 ${
              visibleItems >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
          >
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>

          <div
            className={`transition-all duration-700 ${
              visibleItems >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <h1 className="text-3xl font-bold italic text-foreground">
              Tu suscripción venció
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
              {subscription?.planName
                ? `Tu plan ${subscription.planName} venció${expiredDate ? ` el ${expiredDate}` : ""}. `
                : "Tu plan de entrenamiento venció. "}
              Renovalo para seguir entrenando sin interrupciones.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div
          className={`mt-8 transition-all duration-700 ${
            visibleItems >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Card className="border-border/50">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-destructive text-destructive-foreground">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="w-0.5 h-full min-h-[24px] mt-1 bg-destructive/40" />
                  </div>
                  <div className="pb-2">
                    <p className="font-semibold text-sm text-foreground">
                      Plan vencido
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {expiredDate
                        ? `Venció el ${expiredDate}`
                        : "Tu suscripción ya no está activa"}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/20 text-primary ring-2 ring-primary/50">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="w-0.5 h-full min-h-[24px] mt-1 bg-border" />
                  </div>
                  <div className="pb-2">
                    <p className="font-semibold text-sm text-foreground">
                      Renovar suscripción
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Elegí un plan y pagá de forma segura por MercadoPago.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pb-2">
                    <p className="font-semibold text-sm text-foreground">
                      Volver a entrenar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Una vez activado, recuperás el acceso completo a tu app.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coach info */}
        {userCoach && (
          <div
            className={`mt-6 transition-all duration-700 ${
              visibleItems >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {coachName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      ¿Tenés dudas sobre tu plan o necesitás ayuda para renovar?
                    </p>
                  </div>
                </div>

                {whatsappUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 gap-2"
                    onClick={() => window.open(whatsappUrl, "_blank")}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contactar a mi coach
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div
          className={`mt-8 space-y-4 transition-all duration-700 ${
            visibleItems >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button
            size="lg"
            className="w-full h-auto py-3.5 gap-2"
            onClick={() => router.push("/subscription?expired=1")}
          >
            <CreditCard className="w-4 h-4" />
            Renovar suscripción
          </Button>
        </div>
      </main>
    </div>
  );
}
