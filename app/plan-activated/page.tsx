"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserCoach } from "@/hooks/use-user-coach";
import { useUserDisciplines } from "@/hooks/use-user-disciplines";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  MessageCircle,
  Dumbbell,
  Sparkles,
  Loader2,
  Bell,
  BellOff,
  BellRing,
} from "lucide-react";

interface Step {
  id: number;
  label: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
}

/** Solo permite preview en desarrollo. Devuelve estado leído de query params. */
function getPreviewState() {
  if (typeof window === "undefined") return { isPreview: false, hasDisciplines: false };
  if (process.env.NODE_ENV !== "development") return { isPreview: false, hasDisciplines: false };
  const params = new URLSearchParams(window.location.search);
  const isPreview = params.get("preview") === "1";
  return {
    isPreview,
    hasDisciplines: isPreview ? params.get("disciplines") === "1" : false,
  };
}

function getWhatsAppUrl(phone: string | null | undefined, coachName: string): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    cleaned = cleaned.startsWith("54") ? "+" + cleaned : "+54" + cleaned;
  }
  const message = `Hola ${coachName}, acabo de activar mi plan en BoxPlan. ¿Podrías asignarme mis disciplinas para empezar a entrenar?`;
  return `https://wa.me/${cleaned.replace(/\+/g, "")}?text=${encodeURIComponent(message)}`;
}

export default function PlanActivatedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { coach: userCoach, loading: coachLoading } = useUserCoach();
  const { disciplines: userDisciplines, loading: disciplinesLoading } = useUserDisciplines();
  const { isSubscribed, loading: subscriptionLoading, hasPersonalizedWorkouts } = useStudentSubscription();
  const {
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    loading: pushLoading,
    subscribe: pushSubscribe,
  } = usePushNotifications();

  const [visibleItems, setVisibleItems] = useState<number>(0);

  const { isPreview, hasDisciplines: previewHasDisciplines } = getPreviewState();

  // Limpiar cache de suscripción para forzar datos frescos en la próxima carga
  useEffect(() => {
    if (typeof window !== "undefined") {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("student_subscription_"))
        .forEach((key) => localStorage.removeItem(key));
    }
  }, []);

  // Animación escalonada de los elementos
  useEffect(() => {
    if (!isPreview && (coachLoading || disciplinesLoading || subscriptionLoading)) return;

    const timers: NodeJS.Timeout[] = [];
    [0, 1, 2, 3, 4, 5].forEach((i) => {
      timers.push(
        setTimeout(() => {
          setVisibleItems((prev) => Math.max(prev, i + 1));
        }, i * 180)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [coachLoading, disciplinesLoading, subscriptionLoading, isPreview]);

  const hasDisciplines = isPreview ? previewHasDisciplines : userDisciplines.length > 0;
  const isPersonalizedOnly = hasPersonalizedWorkouts && !hasDisciplines;
  const isLoading = isPreview ? false : (coachLoading || disciplinesLoading || subscriptionLoading);

  const steps: Step[] = [
    {
      id: 1,
      label: "Pago completado",
      description: "Tu suscripción fue procesada exitosamente.",
      status: "completed",
    },
    {
      id: 2,
      label: "Plan activado",
      description: "Tu suscripción está activa y vigente.",
      status: "completed",
    },
    ...(isPersonalizedOnly
      ? [
          {
            id: 3,
            label: "Plan personalizado",
            description: "Tu plan no requiere disciplinas asignadas. Tu coach creará tus entrenamientos a medida.",
            status: "completed" as const,
          },
          {
            id: 4,
            label: "Primer entrenamiento",
            description: "Tu coach está preparando tu primera planificación personalizada.",
            status: "in-progress" as const,
          },
        ]
      : [
          {
            id: 3,
            label: hasDisciplines ? "Disciplinas asignadas" : "Asignación de disciplinas",
            description: hasDisciplines
              ? "Tu coach ya te asignó tus disciplinas."
              : "Tu coach está preparando tus disciplinas y niveles.",
            status: hasDisciplines ? ("completed" as const) : ("in-progress" as const),
          },
          {
            id: 4,
            label: "Primer entrenamiento",
            description: hasDisciplines
              ? "¡Estás listo para entrenar!"
              : "Te avisaremos cuando esté todo listo.",
            status: hasDisciplines ? ("completed" as const) : ("pending" as const),
          },
        ]),
  ];

  const coachName = isPreview
    ? "Coach Preview"
    : (userCoach?.name || userCoach?.businessName || "Tu coach");
  const coachPhone = isPreview ? "+5491112345678" : userCoach?.phone;
  const whatsappUrl = getWhatsAppUrl(coachPhone, coachName);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground flex items-center justify-center">
        <div className="absolute inset-0 kinetic-grid-bg pointer-events-none" aria-hidden="true" />
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Activando tu plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 kinetic-grid-bg pointer-events-none" aria-hidden="true" />

      <main className="px-5 py-8 pb-12 max-w-md mx-auto flex flex-col min-h-[100dvh]">
        {/* Header */}
        <div className="text-center space-y-4 pt-4">
          <div
            className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto neon-border transition-all duration-700 ${
              visibleItems >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
          >
            <Sparkles className="w-10 h-10 text-primary" />
          </div>

          <div
            className={`transition-all duration-700 ${
              visibleItems >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <h1 className="text-3xl font-bold italic text-foreground">
              ¡Plan activado!
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
              {hasDisciplines
                ? "Todo listo. Ya podés empezar a entrenar."
                : isPersonalizedOnly
                  ? "Tu plan personalizado está activo. Tu coach está preparando tu primera planificación."
                  : "Tu suscripción está activa. Estamos preparando todo para que empieces a entrenar."}
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
                {steps.map((step, index) => (
                  <div key={step.id} className="flex gap-4">
                    {/* Icon / line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          step.status === "completed"
                            ? "bg-primary text-primary-foreground"
                            : step.status === "in-progress"
                            ? "bg-primary/20 text-primary ring-2 ring-primary/50"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : step.status === "in-progress" ? (
                          <Clock className="w-5 h-5 animate-pulse" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-0.5 h-full min-h-[24px] mt-1 ${
                            step.status === "completed" ? "bg-primary/40" : "bg-border"
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-2">
                      <p
                        className={`font-semibold text-sm ${
                          step.status === "pending"
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coach info */}
        {!hasDisciplines && (isPreview || userCoach) && (
          <div
            className={`mt-6 transition-all duration-700 ${
              visibleItems >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {coachName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {isPersonalizedOnly
                        ? "Está preparando tu primera planificación personalizada."
                        : "Está configurando tus disciplinas y niveles."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Usualmente esto toma unas pocas horas. Si querés agilizarlo, contactalo directamente.
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

        {/* Push notifications prompt */}
        {!hasDisciplines && pushPermission !== "unsupported" && (
          <div
            className={`mt-6 transition-all duration-700 ${
              visibleItems >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Card
              className={
                isPushSubscribed
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-primary/20 bg-primary/5"
              }
            >
              <CardContent className="pt-5 pb-5">
                {isPushSubscribed ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <BellRing className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        Notificaciones activas
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Te avisaremos en cuanto tu coach termine de configurar tus disciplinas.
                      </p>
                    </div>
                  </div>
                ) : pushPermission === "denied" ? (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <BellOff className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        Notificaciones bloqueadas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Habilitá las notificaciones desde la configuración de tu navegador para que te avisemos cuando esté todo listo.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          Activá las notificaciones
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {isPersonalizedOnly
                            ? "Te avisaremos en cuanto tu coach cargue tu primera planificación personalizada, así no tenés que estar entrando a la app todo el tiempo."
                            : "Te avisaremos en cuanto tu coach termine de configurar tus disciplinas, así no tenés que estar entrando a la app todo el tiempo."}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={async () => {
                        const ok = await pushSubscribe();
                        if (ok) {
                          toast({
                            title: "¡Listo!",
                            description: isPersonalizedOnly
                              ? "Te avisaremos cuando tu coach cargue tu primera planificación personalizada."
                              : "Te avisaremos cuando tus disciplinas estén configuradas.",
                          });
                        } else if (Notification.permission === "denied") {
                          toast({
                            title: "Permiso denegado",
                            description:
                              "Habilitá las notificaciones desde la configuración de tu navegador.",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={pushLoading}
                    >
                      {pushLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                      Activar notificaciones
                    </Button>
                  </div>
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
            visibleItems >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {hasDisciplines ? (
            <Button
              size="lg"
              className="w-full h-auto py-3.5 gap-2"
              onClick={() => router.push("/")}
            >
              Ir a entrenar
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">Esperando configuración de tu coach</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
