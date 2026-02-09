"use client";

import { useRouter } from "next/navigation";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { useStudentCoach } from "@/hooks/use-student-coach";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, AlertTriangle, Loader2 } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isSubscribed, loading: subscriptionLoading } = useStudentSubscription();
  const { coach, loading: coachLoading } = useStudentCoach();
  console.log(coach)
  // Mostrar loading mientras se verifica
  if (subscriptionLoading || coachLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  // Si tiene suscripción, mostrar el contenido
  if (isSubscribed) {
    return <>{children}</>;
  }

  // Si no tiene suscripción, mostrar pantalla de acceso restringido
  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6">
      <Card className="border-amber-500/30 bg-amber-500/5 w-full max-w-md">
        <CardContent className="pt-6 text-center py-6 sm:py-12 space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Acceso Beta Limitado
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Actualmente no tienes un plan activo. Para acceder a esta funcionalidad,
              contacta a tu coach.
            </p>
          </div>

          {coach?.phone ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Envíale un mensaje a <strong>{coach.businessName || 'tu coach'}</strong> para que te dé de alta:
              </p>
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 w-full"
                onClick={() => {
                  const message = encodeURIComponent(
                    `Hola ${coach.businessName || ''}, soy ${user?.name || ''}. ` +
                    `Quiero acceder a las planificaciones de entrenamiento. ¿Podés darme de alta?`
                  );
                  window.open(`https://wa.me/${coach.phone}?text=${message}`, '_blank');
                }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contactar por WhatsApp
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No se encontró información de contacto de tu coach.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/subscription')}
                className="w-full"
              >
                Ver Planes Disponibles
              </Button>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Versión Beta - Estamos trabajando para mejorar tu experiencia
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
