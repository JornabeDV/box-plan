"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Shield,
  Zap,
} from "lucide-react";

interface PlanDistributionItem {
  count: number;
  displayName: string;
  name: string;
}

interface SuperAdminStatsProps {
  stats: {
    totalCoaches: number;
    activeCoaches: number;
    trialCoaches: number;
    expiredCoaches: number;
    totalStudents: number;
    totalEarnings: number;
    planDistribution: Record<string, PlanDistributionItem>;
  };
}

export function SuperAdminStats({ stats }: SuperAdminStatsProps) {
  const statsCards = [
    {
      title: "Total Coaches",
      value: stats.totalCoaches,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Coaches Activos",
      value: stats.activeCoaches,
      icon: Shield,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "En Período de Prueba",
      value: stats.trialCoaches,
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Total Estudiantes",
      value: stats.totalStudents,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Ganancias Totales",
      value: new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(stats.totalEarnings),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Coaches Expirados",
      value: stats.expiredCoaches,
      icon: Calendar,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Estadísticas Generales</h2>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Distribución de planes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Distribución de Planes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.planDistribution).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay distribución de planes disponible
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(stats.planDistribution).map(
                ([planKey, planData]) => {
                  // Colores dinámicos basados en el nombre del plan
                  const getPlanColor = (planName: string) => {
                    const name = planName.toLowerCase();
                    if (name === "start") return "text-blue-600";
                    if (name === "power") return "text-purple-600";
                    if (name === "elite") return "text-yellow-600";
                    if (name === "no_plan") return "text-gray-600";
                    // Colores alternativos para planes personalizados
                    const colors = [
                      "text-emerald-600",
                      "text-orange-600",
                      "text-pink-600",
                      "text-indigo-600",
                      "text-teal-600",
                    ];
                    const hash = planName
                      .split("")
                      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    return colors[hash % colors.length];
                  };

                  return (
                    <div
                      key={planKey}
                      className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div
                        className={`text-2xl font-bold ${getPlanColor(
                          planData.name
                        )}`}
                      >
                        {planData.count}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {planData.displayName}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
