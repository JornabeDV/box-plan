"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Star, Zap } from "lucide-react"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  features: string[]
  is_popular?: boolean
}

interface PlanSwitcherProps {
  currentPlanId: string
  plans: Plan[]
  onPlanSelect: (planId: string) => void
  loading?: boolean
}

const planIcons = {
  'Básico': Zap,
  'Intermedio': Star,
  'Pro': Crown
}

const getColorClasses = (planName: string) => {
  switch (planName) {
    case 'Básico':
      return {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        button: 'bg-blue-600 hover:bg-blue-700'
      }
    case 'Intermedio':
      return {
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        button: 'bg-purple-600 hover:bg-purple-700'
      }
    case 'Pro':
      return {
        gradient: 'from-yellow-500 to-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        button: 'bg-yellow-600 hover:bg-yellow-700'
      }
    default:
      return {
        gradient: 'from-gray-500 to-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        button: 'bg-gray-600 hover:bg-gray-700'
      }
  }
}

export function PlanSwitcher({ 
  currentPlanId, 
  plans, 
  onPlanSelect, 
  loading = false 
}: PlanSwitcherProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    onPlanSelect(planId)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Cambiar Plan de Suscripción</h2>
        <p className="text-muted-foreground">
          Elige el plan que mejor se adapte a tus necesidades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const PlanIcon = planIcons[plan.name as keyof typeof planIcons] || Zap
          const isCurrentPlan = plan.id === currentPlanId
          const isSelected = selectedPlan === plan.id
          const isPopular = plan.is_popular
          const colors = getColorClasses(plan.name)

          return (
            <Card 
              key={plan.id}
              className={`relative transition-all duration-300 ${
                isPopular 
                  ? 'ring-2 ring-purple-500 shadow-lg scale-105' 
                  : 'hover:shadow-lg hover:scale-105'
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Más Popular
                  </Badge>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-600 text-white px-3 py-1">
                    <Check className="w-3 h-3 mr-1" />
                    Actual
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${colors.bg} flex items-center justify-center text-3xl`}>
                  <PlanIcon className="w-8 h-8" />
                </div>
                
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">${plan.price.toLocaleString()}</span>
                    <span className="text-gray-500 ml-1">/{plan.interval}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={loading || isCurrentPlan}
                  className={`w-full ${colors.button} text-white ${
                    isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  size="lg"
                >
                  {loading ? (
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                  ) : isCurrentPlan ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Plan Actual
                    </>
                  ) : isSelected ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Seleccionado
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Seleccionar Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedPlan && selectedPlan !== currentPlanId && (
        <Card className="border-accent bg-accent/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">¿Confirmar cambio de plan?</h3>
              <p className="text-sm text-muted-foreground">
                El cambio se aplicará inmediatamente y se ajustará el prorrateo del pago.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => setSelectedPlan(null)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    // La lógica de cambio se maneja en el componente padre
                    setSelectedPlan(null)
                  }}
                  disabled={loading}
                >
                  Confirmar Cambio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}