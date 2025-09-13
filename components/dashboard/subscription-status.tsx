"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProfile } from "@/hooks/use-profile"
import { Crown, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export function SubscriptionStatus() {
  const { subscription, loading } = useProfile()

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-muted-foreground" />
            Estado de Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Sin Suscripción Activa</h3>
            <p className="text-muted-foreground mb-4">
              No tienes una suscripción activa en este momento
            </p>
            <Link href="/pricing">
              <Button className="w-full">
                <Crown className="h-4 w-4 mr-2" />
                Ver Planes Disponibles
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      case 'past_due':
      case 'unpaid':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'canceled':
        return <XCircle className="h-4 w-4" />
      case 'past_due':
      case 'unpaid':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const isExpiringSoon = () => {
    if (!subscription) return false
    const endDate = new Date(subscription.current_period_end)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Estado de Suscripción
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Plan Activo</h3>
            <p className="text-sm text-muted-foreground">ID: {subscription.plan_id}</p>
          </div>
          <Badge className={getStatusColor(subscription.status)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(subscription.status)}
              {subscription.status}
            </div>
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Inicio del período:</p>
            <p className="font-medium">
              {new Date(subscription.current_period_start).toLocaleDateString('es-AR')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Fin del período:</p>
            <p className="font-medium">
              {new Date(subscription.current_period_end).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        {subscription.cancel_at_period_end && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              ⚠️ Tu suscripción se cancelará al final del período actual
            </p>
          </div>
        )}

        {isExpiringSoon() && !subscription.cancel_at_period_end && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⏰ Tu suscripción expira en {formatDistanceToNow(new Date(subscription.current_period_end), { 
                addSuffix: true, 
                locale: es 
              })}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Link href="/profile" className="flex-1">
            <Button variant="outline" className="w-full">
              Ver Detalles Completos
            </Button>
          </Link>
          <Link href="/pricing" className="flex-1">
            <Button variant="outline" className="w-full">
              Gestionar Suscripción
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}