"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CreditCard, 
  Calendar, 
  RefreshCw, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Crown,
  Zap,
  Star
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  mercadopago_subscription_id: string | null
  mercadopago_payment_id: string | null
  created_at: string
  updated_at: string
  subscription_plans?: {
    name: string
    price: number
    features: string[]
  }
}

interface SubscriptionManagementProps {
  subscription: Subscription | null
  onPlanChange: (newPlanId: string) => void
  onCancel: () => void
  onReactivate: () => void
  loading?: boolean
}

const planIcons = {
  'Basic': Zap,
  'Pro': Star,
  'Elite': Crown
}

const statusColors = {
  'active': 'bg-green-100 text-green-800',
  'canceled': 'bg-red-100 text-red-800',
  'past_due': 'bg-yellow-100 text-yellow-800',
  'unpaid': 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  'active': 'Activa',
  'canceled': 'Cancelada',
  'past_due': 'Vencida',
  'unpaid': 'Impaga'
}

export function SubscriptionManagement({ 
  subscription, 
  onPlanChange, 
  onCancel, 
  onReactivate,
  loading = false 
}: SubscriptionManagementProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Gestión de Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No tienes una suscripción activa. 
              <Button variant="link" className="p-0 h-auto ml-1">
                Suscribirse ahora
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const plan = subscription.subscription_plans
  const PlanIcon = plan ? planIcons[plan.name as keyof typeof planIcons] || Zap : Zap
  const isExpiringSoon = new Date(subscription.current_period_end) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const isExpired = new Date(subscription.current_period_end) < new Date()

  return (
    <div className="space-y-6">
      {/* Estado actual de la suscripción */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Gestión de Suscripción
            </div>
            <Badge className={statusColors[subscription.status]}>
              {statusLabels[subscription.status]}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan actual */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PlanIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{plan?.name || 'Plan Básico'}</h3>
                <p className="text-sm text-muted-foreground">
                  ${plan?.price?.toLocaleString() || '2,999'} ARS / mes
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onPlanChange(subscription.plan_id)}
              disabled={loading}
            >
              Cambiar Plan
            </Button>
          </div>

          {/* Fechas importantes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Inicio del período</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(subscription.current_period_start).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Próxima renovación</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(subscription.current_period_end).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>

          {/* Alertas */}
          {isExpired && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Tu suscripción ha expirado. Renueva para continuar disfrutando del servicio.
              </AlertDescription>
            </Alert>
          )}
          
          {isExpiringSoon && !isExpired && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Tu suscripción expira en {formatDistanceToNow(new Date(subscription.current_period_end), { 
                  addSuffix: true, 
                  locale: es 
                })}. 
                <Button variant="link" className="p-0 h-auto ml-1 text-yellow-800">
                  Renovar ahora
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Características del plan */}
          {plan?.features && (
            <div>
              <h4 className="font-medium mb-2">Características incluidas:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-2">
            {subscription.status === 'active' && !subscription.cancel_at_period_end && (
              <Button 
                variant="outline" 
                onClick={() => setShowCancelConfirm(true)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar Suscripción
              </Button>
            )}
            
            {subscription.cancel_at_period_end && (
              <Button 
                onClick={onReactivate}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reactivar Suscripción
              </Button>
            )}
            
            {subscription.status === 'past_due' && (
              <Button 
                onClick={() => {/* Lógica de renovación */}}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Renovar Ahora
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmación de cancelación */}
      {showCancelConfirm && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Confirmar Cancelación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que quieres cancelar tu suscripción? 
              Podrás seguir usando el servicio hasta el final del período actual.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={() => {
                  onCancel()
                  setShowCancelConfirm(false)
                }}
                disabled={loading}
              >
                Sí, Cancelar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCancelConfirm(false)}
              >
                No, Mantener
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}