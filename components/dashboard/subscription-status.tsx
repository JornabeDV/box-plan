"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProfile } from "@/hooks/use-profile"
import { Crown, CheckCircle, XCircle, Clock, AlertTriangle, Zap, Star, Sparkles, ArrowRight } from "lucide-react"
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
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden relative">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Desbloquea tu Potencial
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative space-y-6">
          {/* Hero section */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <h3 className="text-2xl font-bold">
                ¡Eleva tu Entrenamiento!
              </h3>
              <Sparkles className="h-6 w-6 text-accent animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Accede a planes personalizados, seguimiento completo y herramientas profesionales
            </p>
          </div>

          {/* Benefits list */}
          <div className="grid grid-cols-1 gap-3 bg-card/50 rounded-lg p-4 border border-primary/10">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full mt-0.5">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Planes de entrenamiento personalizados</p>
                <p className="text-xs text-muted-foreground">Adaptados a tu nivel y objetivos</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full mt-0.5">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Seguimiento completo de progreso</p>
                <p className="text-xs text-muted-foreground">Métricas y estadísticas detalladas</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full mt-0.5">
                <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Acceso a toda la plataforma</p>
                <p className="text-xs text-muted-foreground">Sin limitaciones, todo incluido</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/subscription" className="block">
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <span>Ver Planes y Precios</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Trust indicator */}
          <p className="text-center text-xs text-muted-foreground">
            ✓ Pago seguro • ✓ Cancela cuando quieras • ✓ Soporte 24/7
          </p>
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
          <Link href="/subscription" className="flex-1">
            <Button variant="outline" className="w-full">
              Gestionar Suscripción
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}