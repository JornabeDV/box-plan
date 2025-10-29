'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PlanCard } from '@/components/pricing/plan-card'
import { PLANS, formatPrice } from '@/lib/plans'
import { useSubscription } from '@/hooks/use-subscription'
import { Loader2, CreditCard, Shield, Zap } from 'lucide-react'

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const { subscription, createSubscription, getCurrentPlan } = useSubscription()

  const currentPlan = getCurrentPlan()

  const handleSelectPlan = async (planId: string) => {
    setLoading(planId)
    
    try {
      const { preference, error } = await createSubscription(planId, 'mercadopago')
      
      if (error) {
        console.error('Error creating subscription:', error)
        return
      }

      if (preference?.init_point) {
        // Redirigir a MercadoPago
        window.location.href = preference.init_point
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Elige tu Plan de Entrenamiento
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Maximiza tu rendimiento CrossFit con planes diseñados para cada nivel de atleta
          </p>

          {/* Toggle Anual/Mensual */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-lg ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
              Mensual
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-lg ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {isYearly && (
              <Badge className="bg-green-100 text-green-800 ml-2">
                Ahorra 20%
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Planes */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isYearly={isYearly}
              onSelect={handleSelectPlan}
              loading={loading === plan.id}
              currentPlan={currentPlan?.id === plan.id}
            />
          ))}
        </div>
      </div>

      {/* Características adicionales */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              ¿Por qué elegir Box Plan?
            </h2>
            <p className="text-lg text-muted-foreground">
              Más que una app, es tu compañero de entrenamiento
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seguro y Confiable</h3>
              <p className="text-muted-foreground">
                Tus datos están protegidos con encriptación de nivel bancario
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Actualizaciones Constantes</h3>
              <p className="text-muted-foreground">
                Nuevas funcionalidades y mejoras cada semana
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pago Seguro</h3>
              <p className="text-muted-foreground">
                Procesado por MercadoPago, líder en pagos online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                ¿Puedo cambiar de plan en cualquier momento?
              </h3>
              <p className="text-muted-foreground">
                Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplicarán en tu próximo ciclo de facturación.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                ¿Qué métodos de pago aceptan?
              </h3>
              <p className="text-muted-foreground">
                Aceptamos todas las tarjetas de crédito y débito, transferencias bancarias y billeteras digitales a través de MercadoPago.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                ¿Hay período de prueba gratuito?
              </h3>
              <p className="text-muted-foreground">
                Sí, ofrecemos 7 días de prueba gratuita para todos los planes. Puedes cancelar en cualquier momento sin compromiso.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                ¿Puedo cancelar mi suscripción?
              </h3>
              <p className="text-muted-foreground">
                Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario. No hay penalizaciones por cancelación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}