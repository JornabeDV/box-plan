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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants";
import { useCoachMotivationalQuotes } from "@/hooks/use-coach-motivational-quotes";
import { useTodayPlanification } from "@/hooks/use-today-planification";
import { useLoadingTimeout } from "@/hooks/use-loading-timeout";

export default function BoxPlanApp() {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [paymentStatusHandled, setPaymentStatusHandled] = useState(false);
  const [isRedirectingCoach, setIsRedirectingCoach] = useState(false);
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
      !isExpired
    ) {
      router.replace("/choose-plan");
    }
  }, [authLoading, subscriptionLoading, user, isCoach, isSubscribed, isExpired, router]);

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

  // Verificar si debe redirigir a login (después del mount)
  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [authLoading, user, router]);

  // Calcular si estamos cargando datos críticos
  // Solo esperar la planificación de hoy si tiene suscripción activa y preferencias
  const isLoadingCriticalData =
    authLoading ||
    profileLoading ||
    subscriptionLoading ||
    disciplinesLoading ||
    (shouldLoadTodayPlanification && todayPlanificationLoading);

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
  if (isLoadingCriticalData && !hasTimedOut) {
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

  // Si debe redirigir, mostrar loading durante la redirección
  if (shouldRedirect || isRedirectingCoach) {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground flex items-center justify-center">
        <div
          className="absolute inset-0 kinetic-grid-bg pointer-events-none"
          aria-hidden="true"
        />
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Redirigiendo...</span>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado y es primera visita, mostrar landing page
  if (!user) {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground">
        <div
          className="absolute inset-0 kinetic-grid-bg pointer-events-none"
          aria-hidden="true"
        />

        <main className="w-full">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 md:py-24">
            <div className="container mx-auto px-6 text-center max-w-4xl">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                Plataforma de entrenamiento
              </Badge>
              <h1 className="text-4xl md:text-6xl font-display tracking-wide mb-6">
                La herramienta para{" "}
                <span className="text-primary">coaches</span> y{" "}
                <span className="text-primary">atletas</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
                Box Plan conecta coaches con sus atletas. Planificaciones
                profesionales, seguimiento de progreso y pagos — todo en un solo
                lugar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push("/pricing")}
                  size="xl"
                  variant="default"
                  className="touch-manipulation"
                >
                  <Settings className="w-5 h-5" />
                  Soy Coach
                </Button>
                <Button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("hasVisitedLogin", "true");
                    }
                    router.push("/login");
                  }}
                  size="xl"
                  variant="glass"
                  className="touch-manipulation"
                >
                  Soy Atleta
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-6 h-6 text-gray-400" />
            </div>
          </section>

          {/* Dual Audience Section */}
          <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-6 max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-display tracking-wide mb-4">
                  ¿Qué ofrece Box Plan?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Una solución distinta para cada rol
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Coach Card */}
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Settings className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-display tracking-wide">
                      Para Coaches
                    </CardTitle>
                    <CardDescription className="text-base">
                      Gestioná tu box, tus alumnos y tus ingresos desde un solo
                      panel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      {
                        icon: FileText,
                        text: "Creá y publicá planificaciones por nivel y disciplina",
                      },
                      {
                        icon: Users,
                        text: "Asigná alumnos a planes y controlá su acceso",
                      },
                      {
                        icon: Calendar,
                        text: "Organizá el calendario de entrenamientos",
                      },
                      {
                        icon: TrendingUp,
                        text: "Seguí el progreso y las marcas de tus atletas",
                      },
                      {
                        icon: MessageCircle,
                        text: "Enviá notificaciones push a tus alumnos",
                      },
                      {
                        icon: Zap,
                        text: "Cobrá suscripciones vía MercadoPago automáticamente",
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <item.icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">
                          {item.text}
                        </span>
                      </div>
                    ))}
                    <div className="pt-4">
                      <Button
                        onClick={() => router.push("/pricing")}
                        className="w-full"
                        variant="default"
                      >
                        Ver planes para coaches
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Athlete Card */}
                <Card className="border-blue-400/30 bg-gradient-to-br from-blue-400/5 to-transparent">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center mb-4">
                      <Target className="w-6 h-6 text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl font-display tracking-wide">
                      Para Atletas
                    </CardTitle>
                    <CardDescription className="text-base">
                      Accedé a las planificaciones de tu coach y entrenás con
                      todas las herramientas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      {
                        icon: FileText,
                        text: "Accedé a las planificaciones de tu coach",
                      },
                      {
                        icon: Timer,
                        text: "Timer profesional: Tabata, AMRAP, EMOM, For Time",
                      },
                      {
                        icon: TrendingUp,
                        text: "Registrá tus marcas y seguí tu progreso",
                      },
                      {
                        icon: Trophy,
                        text: "Ranking y comparativa con tu box",
                      },
                      {
                        icon: Calculator,
                        text: "Calculadora de 1RM y porcentajes",
                      },
                      {
                        icon: Star,
                        text: "Notificaciones de entrenamientos y novedades",
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <item.icon className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-muted-foreground">
                          {item.text}
                        </span>
                      </div>
                    ))}
                    <div className="pt-4">
                      <Button
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            localStorage.setItem("hasVisitedLogin", "true");
                          }
                          router.push("/login");
                        }}
                        className="w-full"
                        variant="outline"
                      >
                        Ya tengo cuenta, ingresar
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-6 max-w-5xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-display tracking-wide mb-4">
                  ¿Cómo funciona?
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Coach flow */}
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Para el Coach
                  </h3>
                  <div className="space-y-6">
                    {[
                      {
                        step: "1",
                        title: "Creá tu cuenta de coach",
                        desc: "Registrate y elegí un plan según la cantidad de alumnos que manejás.",
                      },
                      {
                        step: "2",
                        title: "Cargá tus planificaciones",
                        desc: "Creá bloques de entrenamiento, asigná días y niveles, y publicalos.",
                      },
                      {
                        step: "3",
                        title: "Sumá a tus alumnos",
                        desc: "Invitá a tus atletas a la plataforma y asignalos a los planes que correspondan.",
                      },
                      {
                        step: "4",
                        title: "Cobrá automáticamente",
                        desc: "Tus alumnos pagan la suscripción vía MercadoPago y el dinero llega directo a vos.",
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0 mt-0.5">
                          {item.step}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-muted-foreground text-sm mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Athlete flow */}
                <div>
                  <h3 className="text-xl font-semibold text-blue-400 mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Para el Atleta
                  </h3>
                  <div className="space-y-6">
                    {[
                      {
                        step: "1",
                        title: "Tu coach te registra o te invita",
                        desc: "El coach crea tu cuenta o vos te registrás con el código de tu box.",
                      },
                      {
                        step: "2",
                        title: "Elegís tu plan",
                        desc: "Seleccionás el plan que ofrece tu coach y completás el pago.",
                      },
                      {
                        step: "3",
                        title: "Accedés a tus entrenamientos",
                        desc: "Desde el día 1 tenés acceso a las planificaciones, el timer y el seguimiento.",
                      },
                      {
                        step: "4",
                        title: "Entrenás y progresás",
                        desc: "Registrá tus marcas, seguí tu progreso y recibí las novedades de tu coach.",
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-400/10 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0 mt-0.5">
                          {item.step}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-muted-foreground text-sm mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Reviews Section */}
          <ReviewsSection className="bg-gradient-to-br from-gray-900/50 to-gray-800/50" />

          {/* FAQ Section */}
          <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-6 max-w-3xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-display mb-4 tracking-wide">
                  Preguntas frecuentes
                </h2>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="who" className="bg-card rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    ¿Quién usa Box Plan?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Box Plan está diseñado para coaches de distintas disciplinas
                    y sus atletas. El coach administra la plataforma, crea los
                    planes y cobra las suscripciones. Los atletas acceden al
                    contenido y las herramientas incluidas en su plan.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="athlete-signup"
                  className="bg-card rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    ¿Cómo me registro si soy atleta?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Tu coach te crea una cuenta o te comparte el acceso. Si ya
                    tenés cuenta, ingresá con tu email y contraseña. Para
                    acceder al contenido necesitás un plan activo asignado por
                    tu coach.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="payment"
                  className="bg-card rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    ¿Cómo funcionan los pagos?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Los pagos se procesan vía MercadoPago. El atleta paga la
                    suscripción al coach directamente — el dinero llega a la
                    cuenta del coach. Se aceptan tarjetas de crédito, débito,
                    transferencias y billeteras digitales.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="cancel"
                  className="bg-card rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    ¿Puedo cancelar cuando quiera?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Sí. Los coaches pueden cancelar su suscripción a Box Plan en
                    cualquier momento. Los atletas pueden dejar de renovar su
                    plan con el coach sin penalizaciones.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="device"
                  className="bg-card rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    ¿Funciona en el celular?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Sí, Box Plan es una PWA (Progressive Web App). Podés
                    instalarla en tu teléfono Android o iOS y usarla como una
                    app nativa, con notificaciones push incluidas.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-16 md:py-24 bg-gradient-to-r from-gray-900 to-gray-800">
            <div className="container mx-auto px-6 text-center max-w-3xl">
              <h2 className="text-3xl md:text-5xl font-display mb-4 tracking-wide">
                ¿Sos coach? Empezá hoy.
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Creá tu cuenta, cargá tus planificaciones y empezá a cobrar
                suscripciones a tus atletas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push("/pricing")}
                  size="xl"
                  variant="default"
                  className="touch-manipulation"
                >
                  <Zap className="w-5 h-5" />
                  Ver planes para coaches
                </Button>
                <Button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("hasVisitedLogin", "true");
                    }
                    router.push("/login");
                  }}
                  size="xl"
                  variant="glass"
                  className="touch-manipulation"
                >
                  Ya tengo cuenta
                </Button>
              </div>
              <p className="text-sm text-gray-400 mt-6">
                <Shield className="w-4 h-4 inline mr-1" />
                Cancela cuando quieras. Sin cargos ocultos.
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Para usuarios logueados, verificar si tiene suscripción activa
  // Si no tiene suscripción, mostrar pantalla de acceso restringido (Beta)
  if (!subscriptionLoading && !isSubscribed) {
    // Alumno nuevo sin plan: redirigir a elegir plan (el useEffect arriba lo maneja,
    // mostramos un loading mientras tanto para evitar el flash de la card)
    if (!isExpired) {
      return (
        <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground flex items-center justify-center">
          <div
            className="absolute inset-0 kinetic-grid-bg pointer-events-none"
            aria-hidden="true"
          />
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Redirigiendo...</span>
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
