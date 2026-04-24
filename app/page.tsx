"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { useProfile } from "@/hooks/use-profile";
import { useUserCoach } from "@/hooks/use-user-coach";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { useStudentCoach } from "@/hooks/use-student-coach";
import { TodaySection } from "@/components/dashboard/today-section";
import { KineticWorkoutCard } from "@/components/dashboard/kinetic-workout-card";
import { WeeklyPerformance } from "@/components/dashboard/weekly-performance";
import { ReviewsSection } from "@/components/home/reviews-section";
import { CoachInfoCard } from "@/components/dashboard/coach-info-card";
import { CoachSelector } from "@/components/auth/coach-selector";
import { TrialCalendar } from "@/components/dashboard/trial-calendar";
import { StudentWhatsAppButton } from "@/components/dashboard/student-whatsapp-button";
import { useCurrentUserPreferences } from "@/hooks/use-current-user-preferences";
import { useUserDisciplines } from "@/hooks/use-user-disciplines";
import {
  Loader2,
  Target,
  Calendar,
  Star,
  TrendingUp,
  Timer,
  Users,
  Calculator,
  FileText,
  Zap,
  ArrowRight,
  ChevronDown,
  Shield,
  BarChart3,
  Clock,
  Weight,
  Trophy,
  Settings,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants";
import { useCoachMotivationalQuotes } from "@/hooks/use-coach-motivational-quotes";
import { useTodayPlanification } from "@/hooks/use-today-planification";
import { useLoadingTimeout } from "@/hooks/use-loading-timeout";
import { LandingPage } from "@/components/landing/landing-page";

export default function BoxPlanApp() {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [paymentStatusHandled, setPaymentStatusHandled] = useState(false);
  const [isRedirectingCoach, setIsRedirectingCoach] = useState(false);
  const [isRedirectingStudent, setIsRedirectingStudent] = useState(false);
  const [showLandingOnce, setShowLandingOnce] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, isCoach } = useAuthWithRoles();
  const { subscription, loading: profileLoading } = useProfile();
  const { coach: userCoach, loading: coachLoading } = useUserCoach();
  const {
    canViewRanking,
    canTrackProgress,
    canUseWhatsAppSupport,
    isSubscribed,
    isExpired,
    subscription: studentSubscription,
    loading: subscriptionLoading,
  } = useStudentSubscription();
  const { coach: studentCoach, loading: studentCoachLoading } =
    useStudentCoach();

  // Verificar si tiene acceso a la funcionalidad de progreso
  const hasProgressAccess = canTrackProgress;

  // Verificar si tiene acceso a ranking
  const hasRankingAccess = canViewRanking;

  // Verificar si hay al menos un acceso rápido disponible
  const hasAnyQuickAccess = hasProgressAccess || hasRankingAccess;
  const { loading: preferencesLoading } = useCurrentUserPreferences();
  const { disciplines: userDisciplines, loading: disciplinesLoading } =
    useUserDisciplines();

  // Verificar si el usuario tiene suscripción activa
  const hasActiveSubscription = subscription?.status === "active";

  // El estudiante puede ver el calendario si el coach le asignó al menos una disciplina con nivel
  const hasPreferences = userDisciplines.some((d) => d.levelId !== null);

  // Obtener frases motivacionales del coach (si tiene coach)
  const { quotes: coachQuotes, loading: coachQuotesLoading } =
    useCoachMotivationalQuotes();

  // Obtener planificación de hoy (solo si tiene suscripción activa y preferencias)
  // Solo cargar si tiene suscripción activa y preferencias para evitar llamadas innecesarias
  const shouldLoadTodayPlanification =
    !authLoading &&
    !profileLoading &&
    !disciplinesLoading &&
    user?.id &&
    hasActiveSubscription &&
    hasPreferences;
  const {
    planification: todayPlanification,
    loading: todayPlanificationLoading,
  } = useTodayPlanification({
    enabled: shouldLoadTodayPlanification,
  });

  // Obtener una frase motivacional basada en el día del año para que cambie diariamente
  const getDailyMotivationalQuote = () => {
    // Priorizar frases del coach si existen
    const quotesToUse =
      coachQuotes.length > 0 ? coachQuotes : MOTIVATIONAL_QUOTES;

    if (quotesToUse.length === 0) {
      return "¡Sigue adelante!";
    }

    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000,
    );
    return quotesToUse[dayOfYear % quotesToUse.length];
  };

  // Para coaches, redirigir automáticamente al dashboard
  useEffect(() => {
    if (!authLoading && isCoach && user?.id && !isRedirectingCoach) {
      setIsRedirectingCoach(true);
      router.replace("/admin-dashboard");
    }
  }, [authLoading, isCoach, user?.id, router, isRedirectingCoach]);

  // Para alumnos nuevos sin plan, redirigir directo a elegir plan
  useEffect(() => {
    if (
      !authLoading &&
      !subscriptionLoading &&
      user &&
      !isCoach &&
      !isSubscribed &&
      !isExpired &&
      !isRedirectingStudent
    ) {
      setIsRedirectingStudent(true);
      router.replace("/choose-plan");
    }
  }, [authLoading, subscriptionLoading, user, isCoach, isSubscribed, isExpired, router, isRedirectingStudent]);

  // Mostrar toast cuando se activa una suscripción desde /subscription
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("activated") === "true") {
      toast({
        title: "¡Plan activado! 🎉",
        description: "Tu suscripción está lista. ¡A entrenar!",
      });
      router.replace("/", { scroll: false });
      return;
    }

    // Manejar parámetros de pago después de redirección desde MercadoPago
    if (paymentStatusHandled) return;
    const paymentStatus = urlParams.get("payment");

    if (paymentStatus && !paymentStatusHandled) {
      setPaymentStatusHandled(true);

      if (paymentStatus === "success") {
        toast({
          title: "¡Pago exitoso! 🎉",
          description:
            "Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todos los beneficios.",
          variant: "default",
        });
        // Limpiar el parámetro de la URL
        router.replace("/", { scroll: false });
      } else if (paymentStatus === "failure") {
        toast({
          title: "Pago fallido",
          description:
            "No se pudo procesar el pago. Por favor, intenta nuevamente o contacta con soporte.",
          variant: "destructive",
        });
        // Limpiar el parámetro de la URL
        router.replace("/", { scroll: false });
      } else if (paymentStatus === "pending") {
        toast({
          title: "Pago pendiente",
          description:
            "Tu pago está siendo procesado. Te notificaremos cuando se complete.",
          variant: "default",
        });
        // Limpiar el parámetro de la URL
        router.replace("/", { scroll: false });
      }
    }
  }, [paymentStatusHandled, toast, router]);

  // Leer flag de una sola vez al montar (persiste durante la vida del componente)
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("showLandingOnce") === "true") {
      setShowLandingOnce(true);
    }
  }, []);

  // Verificar si debe redirigir a login (después del mount)
  useEffect(() => {
    if (!authLoading && !user && !shouldRedirect && !showLandingOnce) {
      const hasVisitedLogin =
        typeof window !== "undefined" &&
        localStorage.getItem("hasVisitedLogin");
      const hasAccount =
        typeof window !== "undefined" && localStorage.getItem("hasAccount");

      // Si ya tiene cuenta o ha visitado login, redirigir a login directamente
      if (hasAccount || hasVisitedLogin) {
        setShouldRedirect(true);
        router.push("/login");
      }
    }
  }, [authLoading, user, router, shouldRedirect, showLandingOnce]);

  // Calcular si estamos cargando datos críticos
  // Solo esperar la planificación de hoy si tiene suscripción activa y preferencias
  // Para usuarios no autenticados, solo esperar authLoading para permitir redirección rápida
  const isLoadingCriticalData = user
    ? authLoading ||
      profileLoading ||
      subscriptionLoading ||
      disciplinesLoading ||
      (shouldLoadTodayPlanification && todayPlanificationLoading)
    : authLoading;

  // Determinar si vamos a redirigir (para mostrar un único loading unificado)
  const hasVisitedLogin =
    typeof window !== "undefined" &&
    localStorage.getItem("hasVisitedLogin");
  const hasAccount =
    typeof window !== "undefined" && localStorage.getItem("hasAccount");

  const willRedirectCoach = !authLoading && isCoach && !!user?.id;
  const willRedirectLogin =
    !authLoading &&
    !user &&
    !!(hasAccount || hasVisitedLogin) &&
    !showLandingOnce;
  const willRedirectStudent =
    !authLoading &&
    !subscriptionLoading &&
    !!user &&
    !isCoach &&
    !isSubscribed &&
    !isExpired;

  const isRedirecting =
    willRedirectCoach ||
    willRedirectLogin ||
    willRedirectStudent ||
    shouldRedirect ||
    isRedirectingCoach ||
    isRedirectingStudent;

  // Limpiar el flag de sessionStorage después de que la landing se haya mostrado
  useEffect(() => {
    if (showLandingOnce && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        sessionStorage.removeItem("showLandingOnce");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showLandingOnce]);

  // Timeout para detectar loading infinito (10 segundos para desarrollo)
  const { hasTimedOut } = useLoadingTimeout(isLoadingCriticalData, {
    timeout: 10000,
    onTimeout: () => {
      console.error(
        "[BoxPlanApp] Loading timeout - possible infinite loading detected",
      );
    },
  });

  // Mostrar loading mientras se verifica la autenticación o se redirige
  if ((isLoadingCriticalData || isRedirecting) && !hasTimedOut) {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground flex items-center justify-center">
        <div
          className="absolute inset-0 kinetic-grid-bg pointer-events-none"
          aria-hidden="true"
        />
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  // Si hay timeout, mostrar opción de reintentar con diagnóstico
  if (hasTimedOut) {
    const loadingStatuses = [
      { name: "Autenticación", loading: authLoading },
      { name: "Perfil", loading: profileLoading },
      { name: "Suscripción", loading: subscriptionLoading },
      { name: "Disciplinas", loading: disciplinesLoading },
      {
        name: "Planificación hoy",
        loading: shouldLoadTodayPlanification && todayPlanificationLoading,
      },
    ];

    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground flex items-center justify-center p-6">
        <div
          className="absolute inset-0 kinetic-grid-bg pointer-events-none"
          aria-hidden="true"
        />
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                Tiempo de espera agotado
              </h2>
              <p className="text-muted-foreground text-sm">
                La aplicación está tardando más de lo esperado en cargar.
              </p>
            </div>

            {/* Diagnóstico */}
            <div className="text-left bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Estado de carga:
              </p>
              {loadingStatuses.map((status) => (
                <div key={status.name} className="flex justify-between text-sm">
                  <span>{status.name}:</span>
                  <span
                    className={
                      status.loading ? "text-amber-500" : "text-green-500"
                    }
                  >
                    {status.loading ? "Cargando..." : "Listo"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reintentar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Limpiar caché y recargar
                  if (typeof window !== "undefined") {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = "/login";
                  }
                }}
                className="w-full"
              >
                Limpiar datos y volver a login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar landing page
  if (!user) {
    return <LandingPage />;
  }

  // Para usuarios logueados, verificar si tiene suscripción activa
  // Si no tiene suscripción, mostrar pantalla de acceso restringido (Beta)
  if (!subscriptionLoading && !isSubscribed) {
    // Alumno nuevo sin plan: redirigir a elegir plan (el useEffect arriba lo maneja,
    // el loading unificado ya se muestra gracias a willRedirectStudent)
    if (!isExpired) {
      return null;
    }

    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground">
        <div
          className="absolute inset-0 kinetic-grid-bg pointer-events-none"
          aria-hidden="true"
        />
        <main
          className={`p-6 space-y-6 max-w-4xl mx-auto ${
            isSubscribed ? "pb-32" : ""
          }`}
        >
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            {isExpired && studentSubscription ? (
              <Card className="border-destructive/30 w-full max-w-md">
                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">Tu suscripción venció</h2>
                    <p className="text-muted-foreground text-sm">
                      Tu plan <strong>{studentSubscription.planName}</strong>{" "}
                      venció el{" "}
                      <strong>
                        {new Date(
                          studentSubscription.currentPeriodEnd,
                        ).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </strong>
                      . Renovalo para seguir entrenando.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => router.push("/subscription")}
                  >
                    Renovar suscripción
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-500/30 bg-amber-500/5 w-full max-w-md">
                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6 text-center">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">Sin plan activo</h2>
                    <p className="text-muted-foreground text-sm">
                      Necesitás un plan para acceder a tus planificaciones y
                      funcionalidades de entrenamiento.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => router.push("/choose-plan")}
                  >
                    Ver planes disponibles
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        {/* No mostrar BottomNavigation si no tiene suscripción - evita navegación */}
      </div>
    );
  }

  // Para usuarios logueados con suscripción activa, mostrar dashboard personalizado
  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 kinetic-grid-bg pointer-events-none"
        aria-hidden="true"
      />

      <main className="px-5 py-6 space-y-8 pb-24 max-w-md mx-auto md:max-w-2xl">
        {/* Saludo personalizado */}
        <section className="space-y-2">
          <span className="label-md text-primary tracking-[0.2em]">
            Dashboard
          </span>
          <h1 className="display-lg text-foreground">
            <span className="italic">¡Hola</span>
            <span className="italic text-primary">
              , {user?.name ? user.name.split(" ")[0] : "Atleta"}!
            </span>
          </h1>
          <p className="body-lg text-sm font-semibold text-muted-foreground uppercase">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </section>

        {/* Frase motivacional */}
        {!profileLoading && subscription?.status === "active" && (
          <Card className="accent-left">
            <CardContent>
              <div className="relative">
                <span className="text-4xl text-primary leading-none absolute -top-2 -left-2">
                  &ldquo;
                </span>

                <p className="body-lg text-foreground italic px-4">
                  {getDailyMotivationalQuote()}
                </p>

                <span className="text-4xl text-primary leading-none absolute -bottom-2 -right-2">
                  &rdquo;
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendario de prueba - Para usuarios sin suscripción */}
        {user?.id && !hasActiveSubscription && !profileLoading && (
          <section className="space-y-6">
            {!coachLoading && userCoach && (
              <Card className="accent-left">
                <CardContent>
                  <p className="body-lg text-foreground italic">
                    {getDailyMotivationalQuote()}
                  </p>
                </CardContent>
              </Card>
            )}
            {!coachLoading && userCoach && (
              <TrialCalendar
                coachId={userCoach.id}
                onDateClick={(date) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  const dateString = `${year}-${month}-${day}`;
                  router.push(`/planification?date=${dateString}`);
                }}
              />
            )}
          </section>
        )}

        {/* Planificación de hoy */}
        {user?.id && hasActiveSubscription && (
          <section>
            <KineticWorkoutCard />
          </section>
        )}

        {/* Calendario mensual */}
        {user?.id && hasActiveSubscription && hasPreferences && (
          <section>
            <TodaySection />
          </section>
        )}

        {/* Rendimiento semanal */}
        {user?.id && hasActiveSubscription && (
          <section>
            <WeeklyPerformance />
          </section>
        )}

        {/* Accesos rápidos */}
        {user?.id && hasActiveSubscription && hasAnyQuickAccess && (
          <section className="space-y-3">
            <h2 className="headline-md text-foreground">Accesos Rápidos</h2>
            <div className="grid grid-cols-3 gap-3">
              {hasProgressAccess && (
                <Button
                  variant="ghost"
                  onClick={() => router.push("/progress")}
                  className="h-auto flex-col gap-2 rounded-2xl bg-surface-container p-4 hover:bg-surface-container-high"
                >
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    Progreso
                  </span>
                </Button>
              )}
              {canTrackProgress && (
                <Button
                  variant="ghost"
                  onClick={() => router.push("/log-rm")}
                  className="h-auto flex-col gap-2 rounded-2xl bg-surface-container p-4 hover:bg-surface-container-high"
                >
                  <Weight className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    Carga RM
                  </span>
                </Button>
              )}
              {hasRankingAccess && (
                <Button
                  variant="ghost"
                  onClick={() => router.push("/ranking")}
                  className="h-auto flex-col gap-2 rounded-2xl bg-surface-container p-4 hover:bg-surface-container-high"
                >
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    Ranking
                  </span>
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Información del coach */}
        {user?.id && !coachLoading && userCoach && (
          <section>
            <CoachInfoCard coach={userCoach} />
          </section>
        )}

        {/* Seleccionar coach */}
        {user?.id && !coachLoading && !userCoach && !isCoach && (
          <section>
            <CoachSelector
              userId={user.id}
              onSelect={async (coachId: number) => {
                try {
                  const response = await fetch("/api/coaches/select", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ coachId }),
                  });

                  if (!response.ok) {
                    const data = await response.json();
                    throw new Error(
                      data.error || "Error al seleccionar el coach",
                    );
                  }

                  window.location.reload();
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description:
                      error.message || "No se pudo seleccionar el coach",
                    variant: "destructive",
                  });
                  throw error;
                }
              }}
            />
          </section>
        )}

        {/* Reviews */}
        {user?.id && (
          <section>
            <ReviewsSection variant="default" />
          </section>
        )}
      </main>

      <BottomNavigation />

      {!coachLoading &&
        !subscriptionLoading &&
        userCoach &&
        canUseWhatsAppSupport && (
          <StudentWhatsAppButton
            phone={userCoach.phone}
            coachName={userCoach.name}
          />
        )}
    </div>
  );
}
