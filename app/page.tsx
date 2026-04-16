"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { useProfile } from "@/hooks/use-profile";
import { useUserCoach } from "@/hooks/use-user-coach";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { useStudentCoach } from "@/hooks/use-student-coach";
import { TodaySection } from "@/components/dashboard/today-section";
import { StatsCards } from "@/components/dashboard/stats-cards";
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
  const { disciplines: userDisciplines, loading: disciplinesLoading } = useUserDisciplines();

  // Verificar si el usuario tiene suscripción activa
  const hasActiveSubscription = subscription?.status === "active";

  // El estudiante puede ver el calendario si el coach le asignó al menos una disciplina con nivel
  const hasPreferences = userDisciplines.some(d => d.levelId !== null);

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

  // Manejar parámetros de pago después de redirección desde MercadoPago
  useEffect(() => {
    if (paymentStatusHandled || typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
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

  // Debug: Log which hooks are loading
  useEffect(() => {
    if (isLoadingCriticalData) {
      console.log('[BoxPlanApp] Loading states:', {
        authLoading,
        profileLoading,
        subscriptionLoading,
        disciplinesLoading,
        shouldLoadTodayPlanification,
        todayPlanificationLoading,
        hasUser: !!user,
        userId: user?.id,
        isCoach,
        hasActiveSubscription,
        hasPreferences,
      });
    }
  }, [authLoading, profileLoading, subscriptionLoading, disciplinesLoading, todayPlanificationLoading, shouldLoadTodayPlanification, user, isCoach, hasActiveSubscription, hasPreferences]);

  // Timeout para detectar loading infinito (10 segundos para desarrollo)
  const { hasTimedOut } = useLoadingTimeout(isLoadingCriticalData, {
    timeout: 10000,
    onTimeout: () => {
      console.error('[BoxPlanApp] Loading timeout - possible infinite loading detected');
    }
  });

  // Mostrar loading mientras se verifica la autenticación o se redirige
  if (isLoadingCriticalData && !hasTimedOut) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  // Si hay timeout, mostrar opción de reintentar con diagnóstico
  if (hasTimedOut) {
    const loadingStatuses = [
      { name: 'Autenticación', loading: authLoading },
      { name: 'Perfil', loading: profileLoading },
      { name: 'Suscripción', loading: subscriptionLoading },
      { name: 'Disciplinas', loading: disciplinesLoading },
      { name: 'Planificación hoy', loading: shouldLoadTodayPlanification && todayPlanificationLoading },
    ];

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Tiempo de espera agotado</h2>
              <p className="text-muted-foreground text-sm">
                La aplicación está tardando más de lo esperado en cargar.
              </p>
            </div>
            
            {/* Diagnóstico */}
            <div className="text-left bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Estado de carga:</p>
              {loadingStatuses.map((status) => (
                <div key={status.name} className="flex justify-between text-sm">
                  <span>{status.name}:</span>
                  <span className={status.loading ? "text-amber-500" : "text-green-500"}>
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
                  if (typeof window !== 'undefined') {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/login';
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
          <span>Redirigiendo...</span>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado y es primera visita, mostrar landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />

        <main className="w-full">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 max-w-6xl mx-auto">
                {/* Left: Content */}
                <div className="flex-1 text-center md:text-left space-y-6">
                  <div className="inline-flex items-center justify-center md:justify-start">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/30 via-yellow-400/30 to-orange-400/30 blur-xl rounded-full group-hover:blur-2xl transition-all duration-300"></div>
                      <div className="relative bg-gradient-to-r from-amber-500/90 via-yellow-500/90 to-orange-500/90 backdrop-blur-sm border border-amber-400/50 px-5 py-2 rounded-full shadow-[0_4px_15px_rgba(251,191,36,0.3)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.4)] transition-all duration-300">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          <span className="text-lg animate-pulse">✨</span>
                          <span>Prueba Gratis 7 Días</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <h1 className="text-5xl md:text-7xl font-display tracking-wide">
                    Maximiza tu{" "}
                    <span className="text-lime-400">Rendimiento</span> CrossFit
                  </h1>

                  <p className="text-xl text-gray-300 max-w-xl">
                    La plataforma completa para entrenar, medir y mejorar.
                    Planificaciones especializadas, análisis avanzado, timer
                    profesional y comunidad.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("hasVisitedLogin", "true");
                        }
                        router.push("/login");
                      }}
                      size="xl"
                      variant="default"
                      className="touch-manipulation"
                    >
                      <Zap className="w-6 h-6" />
                      Comenzar Gratis
                    </Button>
                    <Button
                      onClick={() => router.push("/pricing")}
                      size="xl"
                      variant="glass"
                      className="touch-manipulation"
                    >
                      Ver Planes
                      <ArrowRight className="w-6 h-6" />
                    </Button>
                  </div>

                  {/* Social Proof */}
                  <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-lime-400" />
                      <span>5,000+ atletas activos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-lime-400" />
                      <span>10,000+ entrenamientos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span>4.8/5 valoración</span>
                    </div>
                  </div>
                </div>

                {/* Right: Visual Placeholder - Hidden on mobile, shown on desktop */}
                <div className="hidden lg:flex flex-1">
                  <div className="relative w-full max-w-md">
                    <div className="absolute inset-0 bg-lime-400/20 blur-3xl rounded-3xl"></div>
                    <Card className="relative bg-gray-800/80 border-lime-400/30 backdrop-blur-sm">
                      <CardContent className="p-8">
                        <div className="space-y-4">
                          <div className="h-32 bg-gradient-to-r from-lime-400/20 to-purple-400/20 rounded-lg"></div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="h-20 bg-gray-700 rounded"></div>
                            <div className="h-20 bg-gray-700 rounded"></div>
                            <div className="h-20 bg-gray-700 rounded"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-6 h-6 text-gray-400" />
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-display mb-4 tracking-wide">
                  Todo lo que necesitas para mejorar
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Herramientas profesionales diseñadas específicamente para
                  atletas CrossFit
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {[
                  {
                    icon: FileText,
                    title: "Planificaciones de Entrenamiento",
                    description:
                      "Más de 50 planificaciones especializadas organizadas por categorías y niveles",
                    color: "text-blue-400",
                  },
                  {
                    icon: TrendingUp,
                    title: "Seguimiento de Progreso",
                    description:
                      "Análisis detallado de tu evolución con estadísticas y gráficos avanzados",
                    color: "text-green-400",
                  },
                  {
                    icon: Timer,
                    title: "Timer Profesional",
                    description:
                      "Tabata, AMRAP, EMOM, For Time y más modos de entrenamiento",
                    color: "text-purple-400",
                  },
                  {
                    icon: Users,
                    title: "Comunidad",
                    description:
                      "Foro de discusión, leaderboard y motivación con otros atletas",
                    color: "text-orange-400",
                  },
                  {
                    icon: Calculator,
                    title: "Calculadora 1RM",
                    description:
                      "Calcula tu repetición máxima y optimiza tus porcentajes de entrenamiento",
                    color: "text-red-400",
                  },
                  {
                    icon: Calendar,
                    title: "Planificación Avanzada",
                    description:
                      "Entrenamientos personalizados y planificación según tu plan",
                    color: "text-yellow-400",
                  },
                ].map((feature, index) => {
                  const getGradientClass = (color: string) => {
                    const colorMap: Record<string, string> = {
                      "text-blue-400": "from-blue-400/20 to-blue-400/10",
                      "text-green-400": "from-green-400/20 to-green-400/10",
                      "text-purple-400": "from-purple-400/20 to-purple-400/10",
                      "text-orange-400": "from-orange-400/20 to-orange-400/10",
                      "text-red-400": "from-red-400/20 to-red-400/10",
                      "text-yellow-400": "from-yellow-400/20 to-yellow-400/10",
                    };
                    return colorMap[color] || "from-gray-400/20 to-gray-400/10";
                  };

                  return (
                    <Card
                      key={index}
                      className="hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <CardHeader>
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getGradientClass(
                            feature.color,
                          )} flex items-center justify-center mb-4`}
                        >
                          <feature.icon
                            className={`w-6 h-6 ${feature.color}`}
                          />
                        </div>
                        <CardTitle className="font-heading text-lg">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Reviews Section */}
          <ReviewsSection className="bg-gradient-to-br from-gray-900/50 to-gray-800/50" />

          {/* Stats Section */}
          <section className="py-12 bg-card/50">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
                {[
                  { number: "5,000+", label: "Atletas Activos" },
                  { number: "10,000+", label: "Entrenamientos Registrados" },
                  { number: "4.9/5", label: "Valoración Promedio" },
                  { number: "50+", label: "Planificaciones Disponibles" },
                ].map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="text-3xl md:text-4xl font-bold text-lime-400">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing Preview */}
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-display mb-4 tracking-wide">
                  Planes para cada nivel
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Desde principiantes hasta atletas avanzados y coaches
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
                {[
                  {
                    name: "Básico",
                    price: "$9.99",
                    desc: "Perfecto para comenzar",
                  },
                  {
                    name: "Intermedio",
                    price: "$14.99",
                    desc: "Para llevar tu entrenamiento más lejos",
                  },
                  {
                    name: "Pro",
                    price: "$29.99",
                    desc: "Para atletas serios y coaches",
                    popular: true,
                  },
                ].map((plan, index) => (
                  <Card
                    key={index}
                    className={`${
                      plan.popular ? "ring-2 ring-purple-500 scale-105" : ""
                    } hover:shadow-lg transition-all`}
                  >
                    <CardHeader className="text-center">
                      {plan.popular && (
                        <Badge className="mb-2 bg-purple-600">
                          Más Popular
                        </Badge>
                      )}
                      <CardTitle className="text-2xl font-display">
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.desc}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">/mes</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => router.push("/pricing")}
                        className="w-full touch-manipulation"
                        variant={plan.popular ? "premium" : "soft"}
                      >
                        Ver Detalles
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Button
                  onClick={() => router.push("/pricing")}
                  variant="soft"
                  size="lg"
                  className="touch-manipulation"
                >
                  Ver Todos los Planes y Precios
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Prueba gratis 7 días, sin tarjeta de crédito
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-6 max-w-3xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-display mb-4 tracking-wide">
                  Preguntas Frecuentes
                </h2>
                <p className="text-xl text-muted-foreground">
                  Respuestas a las dudas más comunes
                </p>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem
                  value="trial"
                  className="bg-card rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    ¿Hay período de prueba gratuito?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Sí, ofrecemos 7 días de prueba gratuita para todos los
                    planes. Puedes explorar todas las funcionalidades sin
                    compromiso. No necesitas tarjeta de crédito para empezar.
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
                    Absolutamente. Puedes cancelar tu suscripción en cualquier
                    momento desde tu panel de usuario. No hay penalizaciones ni
                    cargos ocultos. Tu acceso permanecerá activo hasta el final
                    del período pagado.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="payment"
                  className="bg-card rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    ¿Qué métodos de pago aceptan?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Aceptamos todas las tarjetas de crédito y débito,
                    transferencias bancarias y billeteras digitales a través de
                    MercadoPago, el líder en pagos online en Latinoamérica.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="device"
                  className="bg-card rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    ¿Funciona en móvil y web?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Sí, nuestra plataforma es completamente responsive y
                    funciona perfectamente en móviles, tablets y computadoras.
                    También ofrecemos experiencia PWA (Progressive Web App) para
                    instalar en tu teléfono.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="level"
                  className="bg-card rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    ¿Necesito ser atleta avanzado?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    No, tenemos planes para todos los niveles. El plan Básico es
                    perfecto para principiantes, y puedes ir escalando según tus
                    necesidades. Todos nuestros planes incluyen herramientas
                    útiles independientemente de tu nivel.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-16 md:py-24 bg-gradient-to-r from-gray-900 to-gray-800">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-6xl font-display mb-4 tracking-wide">
                ¿Listo para mejorar tu rendimiento?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Únete a miles de atletas que ya están mejorando su entrenamiento
                CrossFit
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("hasVisitedLogin", "true");
                    }
                    router.push("/login");
                  }}
                  size="xl"
                  variant="default"
                  className="touch-manipulation"
                >
                  <Zap className="w-6 h-6" />
                  Comenzar Gratis Ahora
                </Button>
                <Button
                  onClick={() => router.push("/pricing")}
                  size="xl"
                  variant="glass"
                  className="touch-manipulation"
                >
                  Ver Precios
                </Button>
              </div>
              <p className="text-sm text-gray-400 mt-6">
                <Shield className="w-4 h-4 inline mr-1" />
                Sin tarjeta. Cancela cuando quieras.
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
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
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
                      Tu plan{" "}
                      <strong>{studentSubscription.planName}</strong> venció el{" "}
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
                    onClick={() => router.push("/subscription")}
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="p-6 space-y-8 pb-28 gap-6 mt-6 pt-4 border-t border-border max-w-6xl mx-auto">
        {/* Saludo personalizado */}
        <section className="mb-3 sm:mb-8">
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                ¡Hola{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
              </h1>
              <p className="text-muted-foreground text-base md:text-lg md:whitespace-nowrap">
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            {/* Frase motivacional - Para usuarios con suscripción activa */}
            {!profileLoading && subscription?.status === "active" && (
              <p className="text-lime-400 text-base md:text-lg font-medium italic">
                {getDailyMotivationalQuote()}
              </p>
            )}
          </div>
        </section>

        {/* Calendario de prueba - Para usuarios sin suscripción */}
        {user?.id && !hasActiveSubscription && !profileLoading && (
          <section className="space-y-6">
            {/* Frase motivacional - Para usuarios con coach sin suscripción */}
            {!coachLoading && userCoach && (
              <p className="text-lime-400 text-base md:text-lg font-medium italic">
                {getDailyMotivationalQuote()}
              </p>
            )}
            {/* Calendario de entrenamientos - Solo si tiene coach */}
            {!coachLoading && userCoach && (
              <TrialCalendar
                coachId={userCoach.id}
                onDateClick={(date) => {
                  // Formatear fecha como YYYY-MM-DD
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  const dateString = `${year}-${month}-${day}`;

                  // Redirigir a la página de planificación con la fecha
                  router.push(`/planification?date=${dateString}`);
                }}
              />
            )}
          </section>
        )}

        {/* Estadísticas rápidas - Solo para usuarios con suscripción activa */}
        {user?.id && hasActiveSubscription && (
          <section className="mb-3 sm:mb-8">
            <StatsCards />
          </section>
        )}

        {/* Sección del día - Solo para usuarios con suscripción activa y con disciplinas asignadas */}
        {user?.id && hasActiveSubscription && hasPreferences && (
          <section className="mb-3 sm:mb-8">
            <TodaySection />
          </section>
        )}

        {/* Accesos rápidos - Solo para usuarios con suscripción activa y que tengan al menos un acceso disponible */}
        {user?.id && hasActiveSubscription && hasAnyQuickAccess && (
          <section className="mb-3 sm:mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Accesos Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  {hasProgressAccess && (
                    <Button
                      variant="outline"
                      className="flex flex-col items-center gap-1 md:gap-2 h-auto py-3 md:py-6 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                      onClick={() => router.push("/progress")}
                    >
                      <BarChart3 className="w-4 h-4 md:w-6 md:h-6" />
                      <span className="text-xs md:text-base">Progreso</span>
                    </Button>
                  )}
                  {canTrackProgress && (
                    <Button
                      variant="outline"
                      className="flex flex-col items-center gap-1 md:gap-2 h-auto py-3 md:py-6 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                      onClick={() => router.push("/log-rm")}
                    >
                      <Weight className="w-4 h-4 md:w-6 md:h-6" />
                      <span className="text-xs md:text-base">Carga RM</span>
                    </Button>
                  )}
                  {hasRankingAccess && (
                    <Button
                      variant="outline"
                      className="flex flex-col items-center gap-1 md:gap-2 h-auto py-3 md:py-6 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                      onClick={() => router.push("/ranking")}
                    >
                      <Trophy className="w-4 h-4 md:w-6 md:h-6" />
                      <span className="text-xs md:text-base">Ranking</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Información del coach - Antes del carrusel de opiniones */}
        {user?.id && !coachLoading && userCoach && (
          <section className="mb-3 sm:mb-8">
            <CoachInfoCard coach={userCoach} />
          </section>
        )}

        {/* Card para seleccionar coach si no tiene uno */}
        {user?.id && !coachLoading && !userCoach && !isCoach && (
          <section className="mb-3 sm:mb-8">
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

                  // Recargar la página para actualizar el estado
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

        {/* Reviews Section - Al final del dashboard */}
        {user?.id && (
          <section className="mb-3 sm:mb-8">
            <ReviewsSection variant="default" />
          </section>
        )}
      </main>

      <BottomNavigation />

      {/* Botón flotante de WhatsApp para contactar al coach */}
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
