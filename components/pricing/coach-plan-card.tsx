"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Loader2 } from "lucide-react";

interface CoachPlan {
  id: number;
  name: string;
  displayName: string;
  minStudents: number;
  maxStudents: number;
  basePrice: number;
  commissionRate: number;
  features?: any;
}

interface CoachPlanCardProps {
  plan: CoachPlan;
  onSelect: (planId: number) => void;
  loading?: boolean;
  currentPlan?: boolean;
  isAuthenticated?: boolean;
  onRedirectToLogin?: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
};

export function CoachPlanCard({
  plan,
  onSelect,
  loading = false,
  currentPlan = false,
  isAuthenticated = false,
  onRedirectToLogin,
}: CoachPlanCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Planes que tienen período de prueba (Start y Power)
  const hasTrialPeriod =
    plan.name.toLowerCase() === "start" || plan.name.toLowerCase() === "power";

  const getColorClasses = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "start":
        return {
          gradient: "from-blue-500 to-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          button: "bg-blue-600 hover:bg-blue-700",
        };
      case "power":
        return {
          gradient: "from-purple-500 to-purple-600",
          bg: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-700",
          button: "bg-purple-600 hover:bg-purple-700",
        };
      case "elite":
        return {
          gradient: "from-yellow-500 to-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-700",
          button: "bg-yellow-600 hover:bg-yellow-700",
        };
      // Compatibilidad con nombres antiguos
      case "starter":
        return {
          gradient: "from-blue-500 to-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          button: "bg-blue-600 hover:bg-blue-700",
        };
      case "growth":
        return {
          gradient: "from-purple-500 to-purple-600",
          bg: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-700",
          button: "bg-purple-600 hover:bg-purple-700",
        };
      case "enterprise":
        return {
          gradient: "from-yellow-500 to-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-700",
          button: "bg-yellow-600 hover:bg-yellow-700",
        };
      default:
        return {
          gradient: "from-gray-500 to-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-700",
          button: "bg-gray-600 hover:bg-gray-700",
        };
    }
  };

  const colors = getColorClasses(plan.name);
  const isPopular = plan.name.toLowerCase() === "power";

  const features = plan.features
    ? typeof plan.features === "string"
      ? JSON.parse(plan.features)
      : plan.features
    : {};

  const planName = plan.name.toLowerCase();

  // Construir lista de características según el plan
  const buildFeatureList = () => {
    const baseFeatures = [
      plan.maxStudents === 999999
        ? "Alumnos ilimitados con cuenta propia"
        : `Hasta ${plan.maxStudents} alumnos con cuenta propia`,
      `Comisión del ${plan.commissionRate}% por usuario`,
      features.dashboard_custom && "Dashboard personalizado con tu marca",
    ];

    // PLAN START
    if (planName === "start") {
      return [
        ...baseFeatures,
        features.daily_planification &&
          "Planificación diaria (con una semana para cargar)",
        features.max_disciplines &&
          `Hasta ${features.max_disciplines} disciplinas`,
        features.timer && "Cronómetro con tiempos de entrenamiento",
      ].filter(Boolean);
    }

    // PLAN POWER
    if (planName === "power") {
      return [
        ...baseFeatures,
        features.daily_planification &&
          features.planification_monthly &&
          "Planificación diaria con cargas mensuales",
        features.score_loading && "Carga de score por alumno",
        features.score_database &&
          "Base de datos con las cargas de score de cada uno de tus alumnos",
        features.max_disciplines &&
          `Hasta ${features.max_disciplines} disciplinas`,
        features.mercadopago_connection &&
          "Conexión con Mercado Pago para efectuar pagos",
        features.whatsapp_integration && "Vinculación con WhatsApp",
        features.community_forum && "Foro para comunidad",
        features.timer && "Cronómetro con tiempos de entrenamiento",
      ].filter(Boolean);
    }

    // PLAN ELITE
    if (planName === "elite") {
      return [
        ...baseFeatures,
        features.daily_planification &&
          features.planification_unlimited &&
          "Planificación diaria con cargas sin límite",
        features.score_loading && "Carga de score por alumno",
        features.score_database &&
          "Base de datos con las cargas de score de cada uno de tus alumnos",
        features.max_disciplines === 999999 && "Disciplinas ilimitadas",
        features.mercadopago_connection &&
          "Conexión con Mercado Pago para efectuar pagos",
        features.whatsapp_integration && "Vinculación con WhatsApp",
        features.community_forum && "Foro para comunidad",
        features.timer && "Cronómetro con tiempos de entrenamiento",
      ].filter(Boolean);
    }

    // Fallback para planes antiguos o desconocidos
    return [
      ...baseFeatures,
      features.basic_analytics && "Analytics básicos",
      features.advanced_analytics && "Analytics avanzados",
      features.reports && "Reportes detallados",
      features.white_label && "White-label disponible",
      features.api_access && "Acceso a API",
    ].filter(Boolean);
  };

  const featureList = buildFeatureList();

  return (
    <Card
      className={`relative flex flex-col transition-all duration-300 ${
        isPopular
          ? "ring-2 ring-purple-500 shadow-lg scale-105"
          : "hover:shadow-lg hover:scale-105"
      } ${currentPlan ? "ring-2 ring-green-500" : ""} ${
        !loading && !currentPlan ? "cursor-pointer" : "cursor-default"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-purple-600 text-white px-4 py-1">
            <Star className="w-3 h-3 mr-1" />
            Más Popular
          </Badge>
        </div>
      )}

      {hasTrialPeriod && !currentPlan && (
        <div className="absolute -top-3 right-4 z-10">
          <Badge className="bg-green-600 text-white px-3 py-1">
            <Zap className="w-3 h-3 mr-1" />30 días gratis
          </Badge>
        </div>
      )}

      {currentPlan && (
        <div className="absolute -top-3 right-4 z-10">
          <Badge className="bg-green-600 text-white px-3 py-1">
            <Check className="w-3 h-3 mr-1" />
            Actual
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold">{plan.displayName}</CardTitle>
        <CardDescription className="text-base">
          {plan.maxStudents === 999999
            ? "Alumnos ilimitados"
            : plan.minStudents === 1 && plan.maxStudents === 1
            ? "1 alumno"
            : `Hasta ${plan.maxStudents} alumnos`}
        </CardDescription>

        <div className="mt-6 mb-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${colors.bg} border-2 ${colors.border}`}
          >
            <span className={`text-3xl font-bold ${colors.text}`}>
              {plan.maxStudents === 999999 ? "∞" : plan.maxStudents}
            </span>
            <div className="text-left">
              <span className={`block text-sm font-semibold ${colors.text}`}>
                Estudiantes
              </span>
              <span className={`block text-xs ${colors.text} opacity-70`}>
                máximo
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold">
              {formatPrice(plan.basePrice)}
            </span>
            <span className="text-gray-500 ml-1">/mes</span>
          </div>
          {hasTrialPeriod && (
            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-2">
              ✨ Prueba 30 días gratis
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Comisión: {plan.commissionRate}% por estudiante
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex flex-col flex-1">
        <ul className="space-y-3 mb-6 flex-1">
          {featureList.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={() => {
            if (!isAuthenticated && hasTrialPeriod && onRedirectToLogin) {
              onRedirectToLogin();
            } else {
              onSelect(plan.id);
            }
          }}
          disabled={loading || currentPlan}
          className={`w-full mt-auto ${
            currentPlan
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          }`}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : currentPlan ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Plan Actual
            </>
          ) : !isAuthenticated && hasTrialPeriod ? (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Comenzar Prueba Gratis
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Seleccionar Plan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
