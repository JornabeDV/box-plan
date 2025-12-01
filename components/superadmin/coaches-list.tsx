"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Edit, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CoachesListProps {
  coaches: any[];
  loading: boolean;
  onChangePlan: (coach: any) => void;
  onRefresh: () => void;
}

export function CoachesList({
  coaches,
  loading,
  onChangePlan,
}: CoachesListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Activo</Badge>;
      case "trial":
        return <Badge className="bg-yellow-500">En Prueba</Badge>;
      case "expired":
        return <Badge className="bg-red-500">Expirado</Badge>;
      default:
        return <Badge variant="outline">Inactivo</Badge>;
    }
  };

  const getPlanBadge = (plan: any) => {
    if (!plan) {
      return <Badge variant="outline">Sin Plan</Badge>;
    }

    const colors: Record<string, string> = {
      start: "bg-blue-500",
      power: "bg-purple-500",
      elite: "bg-yellow-500",
    };

    return (
      <Badge className={colors[plan.name] || "bg-gray-500"}>
        {plan.displayName}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (coaches.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay coaches</h3>
          <p className="text-muted-foreground">
            No se encontraron coaches con los filtros seleccionados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {coaches.map((coach) => (
        <Card key={coach.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl">
                    {coach.businessName || coach.name || "Sin nombre"}
                  </CardTitle>
                  {getStatusBadge(coach.accessStatus)}
                  {getPlanBadge(coach.plan)}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {coach.email}
                  </div>
                  {coach.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {coach.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {coach.studentCount} / {coach.maxStudents} estudiantes
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangePlan(coach)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Cambiar Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coach.subscription && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    Suscripción
                  </div>
                  <div className="text-sm">
                    Desde:{" "}
                    {format(
                      new Date(coach.subscription.currentPeriodStart),
                      "dd/MM/yyyy",
                      { locale: es }
                    )}
                  </div>
                  <div className="text-sm">
                    Hasta:{" "}
                    {format(
                      new Date(coach.subscription.currentPeriodEnd),
                      "dd/MM/yyyy",
                      { locale: es }
                    )}
                  </div>
                </div>
              )}
              {coach.trialEndsAt && coach.accessStatus === "trial" && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    Período de Prueba
                  </div>
                  <div className="text-sm">
                    Hasta:{" "}
                    {format(new Date(coach.trialEndsAt), "dd/MM/yyyy", {
                      locale: es,
                    })}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Ganancias
                </div>
                <div className="text-sm font-semibold">
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  }).format(coach.calculatedEarnings)}
                </div>
              </div>
              {coach.plan && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    Comisión
                  </div>
                  <div className="text-sm">{coach.plan.commissionRate}%</div>
                </div>
              )}
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Registrado
                </div>
                <div className="text-sm">
                  {format(new Date(coach.createdAt), "dd/MM/yyyy", {
                    locale: es,
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  MercadoPago
                </div>
                <div className="text-sm">
                  {coach.hasMercadoPago ? (
                    <Badge className="bg-green-500">Conectado</Badge>
                  ) : (
                    <Badge variant="outline">No conectado</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
