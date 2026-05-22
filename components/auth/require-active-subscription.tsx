"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { useStudentSubscription } from "@/hooks/use-student-subscription";

interface RequireActiveSubscriptionProps {
  children: React.ReactNode;
}

export function RequireActiveSubscription({
  children,
}: RequireActiveSubscriptionProps) {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    isCoach,
    isAdmin,
  } = useAuthWithRoles();
  const {
    isSubscribed,
    isExpired,
    loading: subscriptionLoading,
  } = useStudentSubscription();

  useEffect(() => {
    if (authLoading || subscriptionLoading) return;

    // Coaches y admins no se ven afectados por el estado de suscripción del estudiante
    if (isCoach || isAdmin) return;

    // Usuarios no logueados no se redirigen (pueden ver landing / páginas públicas)
    if (!user) return;

    if (isExpired) {
      router.replace("/subscription-expired");
      return;
    }

    if (!isSubscribed) {
      router.replace("/choose-plan");
      return;
    }
  }, [
    authLoading,
    subscriptionLoading,
    isCoach,
    isAdmin,
    user,
    isExpired,
    isSubscribed,
    router,
  ]);

  if (authLoading || subscriptionLoading) {
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

  // Coaches, admins, usuarios no logueados y suscriptores activos pueden ver el contenido
  if (isCoach || isAdmin || !user || isSubscribed) {
    return <>{children}</>;
  }

  // Durante la redirección mostramos un spinner
  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground flex items-center justify-center">
      <div
        className="absolute inset-0 kinetic-grid-bg pointer-events-none"
        aria-hidden="true"
      />
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
}
