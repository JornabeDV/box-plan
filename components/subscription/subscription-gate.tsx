"use client";

import { useRouter } from "next/navigation";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, AlertTriangle } from "lucide-react";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const router = useRouter();
  const { subscription, loading, isSubscribed, isExpired } =
    useStudentSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isSubscribed) {
    return <>{children}</>;
  }

  if (isExpired && subscription) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md border-destructive/30">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Tu suscripción venció</h2>
              <p className="text-muted-foreground text-sm">
                Tu plan <strong>{subscription.planName}</strong> venció el{" "}
                <strong>
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    "es-AR",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </strong>
                . Renovalo para seguir entrenando.
              </p>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/subscription")}
            >
              Renovar suscripción
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Necesitás un plan</h2>
            <p className="text-muted-foreground text-sm">
              Suscribite para acceder a tus planificaciones y entrenamientos
            </p>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push("/choose-plan")}
          >
            Ver planes disponibles
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
