"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  DollarSign,
  Calendar,
  UserPlus,
  AlertCircle,
  TrendingUp,
  UserX,
  Target,
  Star,
} from "lucide-react";

interface User {
  id: string;
  has_subscription: boolean;
  updated_at?: string;
  subscription?: {
    current_period_end: string;
    plan: {
      price: number;
      currency: string;
      name?: string;
    };
  } | null;
  created_at: string;
}

interface Planification {
  date: string | Date;
  discipline?: {
    id: number | string;
    name: string;
    color?: string;
  } | null;
  discipline_level?: {
    id: number | string;
    name: string;
  } | null;
  disciplineLevel?: {
    id: number | string;
    name: string;
  } | null;
}

interface AdminStatsProps {
  users: User[];
  planifications: Planification[];
  onTabChange?: (tab: string) => void;
}

export function AdminStats({
  users,
  planifications,
  onTabChange,
}: AdminStatsProps) {
  // Calcular métricas
  const totalUsers = users.length;
  const activeSubscriptions = users.filter((u) => u.has_subscription).length;

  // MRR: Sumar precios de todas las suscripciones activas
  const mrr = users
    .filter((u) => u.has_subscription && u.subscription?.plan)
    .reduce((sum, u) => {
      const price = u.subscription?.plan?.price || 0;
      return sum + price;
    }, 0);

  // Planificaciones del mes actual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const planificationsThisMonth = planifications.filter((p) => {
    if (!p.date) return false;
    const planDate = p.date instanceof Date ? p.date : new Date(p.date);
    return (
      planDate.getMonth() === currentMonth &&
      planDate.getFullYear() === currentYear
    );
  }).length;

  // Nuevos estudiantes este mes
  const newStudentsThisMonth = users.filter((u) => {
    const createdDate = new Date(u.created_at);
    return (
      createdDate.getMonth() === currentMonth &&
      createdDate.getFullYear() === currentYear
    );
  }).length;

  // Suscripciones que vencen pronto (próximos 7 días)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const expiringSoon = users.filter((u) => {
    if (!u.has_subscription || !u.subscription?.current_period_end)
      return false;
    const endDate = new Date(u.subscription.current_period_end);
    const now = new Date();
    return endDate >= now && endDate <= sevenDaysFromNow;
  }).length;

  // Tasa de conversión (% de estudiantes con suscripción activa)
  const conversionRate =
    totalUsers > 0 ? Math.round((activeSubscriptions / totalUsers) * 100) : 0;

  // Estudiantes inactivos (sin actividad en últimos 30 días)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const inactiveStudents = users.filter((u) => {
    if (!u.updated_at) return false;
    const updatedDate = new Date(u.updated_at);
    return updatedDate < thirtyDaysAgo;
  }).length;

  // Disciplinas más utilizadas (top disciplinas en planificaciones con su nivel)
  const disciplineUsage = new Map<
    string,
    { count: number; discipline: string; level: string }
  >();
  planifications.forEach((p) => {
    // Manejar tanto discipline_level como disciplineLevel (camelCase y snake_case)
    const discipline = (p as any).discipline;
    const level = (p as any).discipline_level || (p as any).disciplineLevel;

    if (discipline && level) {
      const disciplineId = discipline.id;
      const levelId = level.id;
      const key = `${disciplineId}-${levelId}`;
      const existing = disciplineUsage.get(key);
      if (existing) {
        existing.count++;
      } else {
        disciplineUsage.set(key, {
          count: 1,
          discipline: discipline.name,
          level: level.name,
        });
      }
    }
  });
  const topDiscipline = Array.from(disciplineUsage.values()).sort(
    (a, b) => b.count - a.count,
  )[0];

  // Plan más popular (plan con más suscriptores)
  const planCounts = new Map<string, number>();
  users.forEach((u) => {
    if (u.has_subscription && u.subscription?.plan?.name) {
      const planName = u.subscription.plan.name;
      planCounts.set(planName, (planCounts.get(planName) || 0) + 1);
    }
  });
  const mostPopularPlan = Array.from(planCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0];

  // Formatear moneda
  const formatCurrency = (amount: number, currency: string = "ARS") => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {/* Estudiantes con suscripción activa */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 max-sm:py-3 max-sm:gap-2"
        onClick={() => onTabChange?.("users")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTabChange?.("users");
          }
        }}
        aria-label="Ver estudiantes"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Estudiantes Activos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSubscriptions}</div>
          <p className="text-xs text-muted-foreground">
            de {totalUsers} estudiantes
          </p>
        </CardContent>
      </Card>

      {/* Ingresos mensuales recurrentes */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 max-sm:py-3 max-sm:gap-2"
        onClick={() => onTabChange?.("plans")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTabChange?.("plans");
          }
        }}
        aria-label="Ver planes de suscripción"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ingresos Mensuales
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(mrr)}</div>
          <p className="text-xs text-muted-foreground">Facturación</p>
        </CardContent>
      </Card>

      {/* Planificaciones del mes actual */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 max-sm:py-3 max-sm:gap-2"
        onClick={() => onTabChange?.("planning")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTabChange?.("planning");
          }
        }}
        aria-label="Ver planificaciones"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Planificaciones del Mes
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{planificationsThisMonth}</div>
          <p className="text-xs text-muted-foreground">Este mes</p>
        </CardContent>
      </Card>

      {/* Nuevos estudiantes este mes */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 max-sm:py-3 max-sm:gap-2"
        onClick={() => onTabChange?.("users")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTabChange?.("users");
          }
        }}
        aria-label="Ver estudiantes"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Nuevos Estudiantes
          </CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newStudentsThisMonth}</div>
          <p className="text-xs text-muted-foreground">Este mes</p>
        </CardContent>
      </Card>

      {/* Suscripciones que vencen pronto */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 max-sm:py-3 max-sm:gap-2"
        onClick={() => onTabChange?.("users")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTabChange?.("users");
          }
        }}
        aria-label="Ver estudiantes"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vencen Pronto</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiringSoon}</div>
          <p className="text-xs text-muted-foreground">Próximos 7 días</p>
        </CardContent>
      </Card>

      {/* Total de estudiantes */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 max-sm:py-3 max-sm:gap-2"
        onClick={() => onTabChange?.("users")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTabChange?.("users");
          }
        }}
        aria-label="Ver estudiantes"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Estudiantes
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">Registrados</p>
        </CardContent>
      </Card>

      {/* Tasa de Conversión */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 max-sm:py-3 max-sm:gap-2"
        onClick={() => onTabChange?.("users")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTabChange?.("users");
          }
        }}
        aria-label="Ver estudiantes"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tasa de Conversión
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Con suscripción activa
          </p>
        </CardContent>
      </Card>

      {/* Estudiantes Inactivos */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 max-sm:py-3 max-sm:gap-2"
        onClick={() => onTabChange?.("users")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTabChange?.("users");
          }
        }}
        aria-label="Ver estudiantes"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Estudiantes Inactivos
          </CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inactiveStudents}</div>
          <p className="text-xs text-muted-foreground">
            Sin actividad reciente (30 días)
          </p>
        </CardContent>
      </Card>

      {/* Disciplinas Más Utilizadas */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 max-sm:py-3 max-sm:gap-2"
        onClick={() => onTabChange?.("disciplines")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTabChange?.("disciplines");
          }
        }}
        aria-label="Ver disciplinas"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Disciplina Más Utilizada
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {topDiscipline ? (
            <>
              <div className="text-2xl font-bold">
                {topDiscipline.discipline}
              </div>
              <p className="text-xs text-muted-foreground">
                {topDiscipline.level} • {topDiscipline.count} planificaciones
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Sin datos disponibles
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Plan Más Popular */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 max-sm:py-3 max-sm:gap-2"
        onClick={() => onTabChange?.("plans")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTabChange?.("plans");
          }
        }}
        aria-label="Ver planes de suscripción"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Plan Más Popular
          </CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {mostPopularPlan ? (
            <>
              <div className="text-2xl font-bold">{mostPopularPlan[0]}</div>
              <p className="text-xs text-muted-foreground">
                {mostPopularPlan[1]} suscriptores
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Sin suscripciones activas
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
