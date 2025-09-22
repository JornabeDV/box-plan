"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubscriptionManagement } from "@/components/subscription/subscription-management"
import { PlanSwitcher } from "@/components/subscription/plan-switcher"
import { useSubscriptionManagement } from "@/hooks/use-subscription-management"
import { ArrowLeft, CreditCard, History, Settings } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function SubscriptionPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  
  const {
    plans,
    currentSubscription,
    loading,
    actionLoading,
    error,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    renewSubscription
  } = useSubscriptionManagement()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando gestión de suscripción...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      {/* Header */}
      <div className="border-b border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gestión de Suscripción</h1>
              <p className="text-muted-foreground">
                Administra tu suscripción y plan de entrenamiento
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Cambiar Plan
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Resumen de Suscripción */}
          <TabsContent value="overview" className="space-y-6">
            <SubscriptionManagement
              subscription={currentSubscription}
              onPlanChange={() => setActiveTab("plans")}
              onCancel={cancelSubscription}
              onReactivate={reactivateSubscription}
              loading={actionLoading}
            />

            {/* Información adicional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Próximos Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentSubscription ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Próximo pago:</span>
                        <span className="font-medium">
                          ${currentSubscription.subscription_plans?.price?.toLocaleString() || '2,999'} ARS
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fecha:</span>
                        <span className="font-medium">
                          {new Date(currentSubscription.current_period_end).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay suscripción activa</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Soporte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    ¿Necesitas ayuda con tu suscripción?
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Contactar Soporte
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cambiar Plan */}
          <TabsContent value="plans" className="space-y-6">
            {plans.length > 0 ? (
              <PlanSwitcher
                currentPlanId={currentSubscription?.plan_id || ''}
                plans={plans}
                onPlanSelect={changePlan}
                loading={actionLoading}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-muted-foreground">Cargando planes disponibles...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Historial */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historial de Suscripciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Aquí podrás ver el historial completo de tus suscripciones y pagos.
                </p>
                {/* TODO: Implementar historial completo */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
