"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { SubscriptionManagement } from "@/components/subscription/subscription-management"
import { PlanSwitcher } from "@/components/subscription/plan-switcher"
import { useSubscriptionManagement } from "@/hooks/use-subscription-management"
import { useUserCoach } from "@/hooks/use-user-coach"
import { CreditCard, History, Settings, CheckCircle, XCircle, Clock, Loader2, ArrowLeft } from "lucide-react"

interface PaymentHistoryItem {
  id: string
  user_id: string
  subscription_id: string | null
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  mercadopago_payment_id: string | null
  payment_method: string | null
  created_at: string
  updated_at: string
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const { coach: userCoach } = useUserCoach()
  
  const {
    plans,
    currentSubscription,
    loading,
    actionLoading,
    error,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    renewSubscription,
    loadCurrentSubscription,
    loadPlans
  } = useSubscriptionManagement()

  // Función para abrir WhatsApp con el coach
  const handleContactSupport = () => {
    if (!userCoach?.phone) {
      return
    }

    // Formatear el número de teléfono para WhatsApp
    const formatPhoneForWhatsApp = (phoneNumber: string): string => {
      let cleaned = phoneNumber.replace(/[^\d+]/g, '')
      
      if (!cleaned.startsWith('+')) {
        if (cleaned.startsWith('54')) {
          cleaned = '+' + cleaned
        } else {
          cleaned = '+54' + cleaned
        }
      }
      
      return cleaned
    }

    const formattedPhone = formatPhoneForWhatsApp(userCoach.phone)
    const message = `Hola ${userCoach.name || 'coach'}, necesito ayuda con mi suscripción en BoxPlan.`
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`
    
    // Abrir WhatsApp en una nueva ventana
    window.open(whatsappUrl, '_blank')
  }

  // Si no hay suscripción, mostrar planes por defecto, sino mostrar overview
  const [activeTab, setActiveTab] = useState<string>(() => {
    // El estado inicial se establecerá después de cargar
    return "overview"
  })

  // Actualizar el tab cuando se carga la suscripción
  useEffect(() => {
    if (!loading && !currentSubscription) {
      setActiveTab("plans")
    } else if (!loading && currentSubscription) {
      setActiveTab("overview")
    }
  }, [loading, currentSubscription])

  // Cargar historial de pagos
  const loadPaymentHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/payment-history')
      if (response.ok) {
        const data = await response.json()
        setPaymentHistory(data.paymentHistory || [])
      }
    } catch (error) {
      console.error('Error loading payment history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      loadPaymentHistory()
    }
  }, [activeTab])

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
      <Header />

      <main className="container mx-auto px-6 py-8 pb-32">
        {/* Título */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h1 className="text-2xl font-bold">Gestión de Suscripción</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
          <p className="text-muted-foreground">
            Administra tu suscripción y plan de entrenamiento
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 border border-input">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-1 sm:gap-2 h-9 text-xs sm:text-sm px-1 sm:px-2">
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 hidden sm:block" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center justify-center gap-1 sm:gap-2 h-9 text-xs sm:text-sm px-1 sm:px-2">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 hidden sm:block" />
              <span className="hidden sm:inline">Cambiar Plan</span>
              <span className="sm:hidden">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center justify-center gap-1 sm:gap-2 h-9 text-xs sm:text-sm px-1 sm:px-2">
              <History className="w-3 h-3 sm:w-4 sm:h-4 hidden sm:block" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Resumen de Suscripción */}
          <TabsContent value="overview" className="space-y-6">
            {currentSubscription ? (
              <>
                <SubscriptionManagement
                  subscription={currentSubscription}
                  onPlanChange={() => setActiveTab("plans")}
                  onCancel={cancelSubscription}
                  onReactivate={reactivateSubscription}
                  onRenew={renewSubscription}
                  loading={actionLoading}
                />

                {/* Información adicional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Próximos Pagos</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={handleContactSupport}
                        disabled={!userCoach?.phone}
                      >
                        Contactar Soporte
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              // Si no hay suscripción, mostrar planes disponibles
              <div className="space-y-6">
                {plans.length > 0 ? (
                  <PlanSwitcher
                    currentPlanId=""
                    plans={plans}
                    onPlanSelect={changePlan}
                    loading={actionLoading}
                    showTitle={true}
                    title="Elige tu Plan"
                    description="Selecciona el plan que mejor se adapte a tus necesidades"
                  />
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">Elige tu Plan</h2>
                        <p className="text-muted-foreground">Cargando planes disponibles...</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Cambiar Plan */}
          <TabsContent value="plans" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Cargando planes disponibles...</p>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <p className="text-destructive font-medium">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        await Promise.all([
                          loadPlans(),
                          loadCurrentSubscription()
                        ])
                      }}
                    >
                      Reintentar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : plans.length > 0 ? (
              <PlanSwitcher
                currentPlanId={currentSubscription?.plan_id || ''}
                plans={plans}
                onPlanSelect={changePlan}
                loading={actionLoading}
                showTitle={true}
                title={currentSubscription ? "Cambiar Plan de Suscripción" : "Elige tu Plan"}
                description={currentSubscription ? "Elige el plan que mejor se adapte a tus necesidades" : "Selecciona el plan que mejor se adapte a tus necesidades"}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No hay planes disponibles en este momento.</p>
                    <p className="text-sm text-muted-foreground">
                      Por favor, contacta al administrador o intenta más tarde.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Historial */}
          <TabsContent value="history" className="space-y-6">
            {/* Título - visible solo en mobile */}
            <div className="sm:hidden">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <History className="w-5 h-5" />
                Historial de Pagos
              </h2>
            </div>

            {/* Funciones helper */}
            {(() => {
              const getStatusBadge = (status: string) => {
                switch (status) {
                  case 'approved':
                    return (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aprobado
                      </Badge>
                    )
                  case 'pending':
                    return (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendiente
                      </Badge>
                    )
                  case 'rejected':
                  case 'cancelled':
                    return (
                      <Badge className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {status === 'rejected' ? 'Rechazado' : 'Cancelado'}
                      </Badge>
                    )
                  default:
                    return (
                      <Badge variant="outline">
                        {status}
                      </Badge>
                    )
                }
              }

              const getPaymentMethodLabel = (method: string | null) => {
                if (!method) return 'Método no especificado'
                
                const methodMap: Record<string, string> = {
                  'manual': 'Manual',
                  'admin_assignment': 'Asignación Admin',
                  'plan_change': 'Cambio de Plan',
                  'mercadopago': 'Mercado Pago',
                  'credit_card': 'Tarjeta de Crédito',
                  'debit_card': 'Tarjeta de Débito',
                  'bank_transfer': 'Transferencia Bancaria'
                }
                
                return methodMap[method] || method
              }

              const formatDate = (dateString: string) => {
                try {
                  const date = new Date(dateString)
                  if (isNaN(date.getTime())) {
                    return 'Fecha inválida'
                  }
                  return date.toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                } catch (error) {
                  return 'Fecha inválida'
                }
              }

              const renderPaymentItem = (payment: PaymentHistoryItem) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 p-4 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-base">
                          ${payment.amount.toLocaleString()} {payment.currency}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getPaymentMethodLabel(payment.payment_method)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-7">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-7 shrink-0">
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              )

              return (
                <>
                  {/* Card solo en desktop */}
                  <Card className="hidden sm:block">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Historial de Pagos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : paymentHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            No hay historial de pagos disponible
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {paymentHistory.map(renderPaymentItem)}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contenido sin card en mobile */}
                  <div className="sm:hidden">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : paymentHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No hay historial de pagos disponible
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {paymentHistory.map(renderPaymentItem)}
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  )
}
