"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, Star, Zap } from "lucide-react"
import { formatPrice } from "@/lib/plans"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  monthlyPersonalizedClasses?: number
  features: string[]
  is_popular?: boolean
}

interface PlanSwitcherProps {
  currentPlanId: string
  plans: Plan[]
  onPlanSelect: (planId: string) => void
  loading?: boolean
  showTitle?: boolean
  title?: string
  description?: string
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
  loading = false,
  showTitle = true,
  title = "Cambiar Plan de Suscripción",
  description = "Elige el plan que mejor se adapte a tus necesidades"
}: PlanSwitcherProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null)

  // Limpiar el estado de procesamiento cuando termine la carga
  useEffect(() => {
    if (!loading && processingPlanId) {
      setProcessingPlanId(null)
      setSelectedPlan(null)
    }
  }, [loading, processingPlanId])

  const handlePlanSelect = (planId: string) => {
    // Solo seleccionar el plan, no ejecutar el cambio aún
    setSelectedPlan(planId)
  }

  const handleConfirmChange = () => {
    if (selectedPlan) {
      setProcessingPlanId(selectedPlan)
      onPlanSelect(selectedPlan)
      // No limpiar selectedPlan aquí, se limpiará cuando termine el proceso
    }
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="text-center px-2">
          <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{title}</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId
          const isSelected = selectedPlan === plan.id
          const isProcessing = processingPlanId === plan.id
          const isPopular = plan.is_popular
          const colors = getColorClasses(plan.name)

          const handleCardClick = () => {
            if (!loading && !isCurrentPlan && !isProcessing) {
              handlePlanSelect(plan.id)
            }
          }

          return (
            <Card 
              key={plan.id}
              onClick={handleCardClick}
              className={`relative flex flex-col transition-all duration-300 ${
                isPopular 
                  ? 'ring-2 ring-purple-500 shadow-lg md:scale-105' 
                  : 'hover:shadow-lg md:hover:scale-105'
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''} ${
                !loading && !isCurrentPlan ? 'cursor-pointer' : 'cursor-default'
              }`}
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

              <CardHeader className="text-center pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-xl md:text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm md:text-base mt-1">{plan.description}</CardDescription>
                
                {/* Clases mensuales personalizadas destacadas */}
                {plan.monthlyPersonalizedClasses && (
                  <div className="mt-4 md:mt-6 mb-3 md:mb-4">
                    <div className={`inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg ${colors.bg} border-2 ${colors.border}`}>
                      <span className={`text-2xl md:text-3xl font-bold ${colors.text}`}>{plan.monthlyPersonalizedClasses}</span>
                      <div className="text-left">
                        <span className={`block text-xs md:text-sm font-semibold ${colors.text}`}>
                          {plan.monthlyPersonalizedClasses === 1 ? 'Clase personalizada' : 'Clases personalizadas'}
                        </span>
                        <span className={`block text-xs ${colors.text} opacity-70`}>por mes</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 md:mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl md:text-4xl font-bold">{formatPrice(plan.price, plan.currency)}</span>
                    <span className="text-gray-500 ml-1 text-sm md:text-base">/{plan.interval}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 flex flex-col flex-1 px-4 md:px-6 pb-4 md:pb-6">
                <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-xs md:text-sm text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isCurrentPlan && !loading && !isProcessing) {
                      handlePlanSelect(plan.id)
                    }
                  }}
                  disabled={loading || isCurrentPlan || isProcessing}
                  className={`w-full mt-auto ${
                    isCurrentPlan 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : isSelected
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground ring-2 ring-primary cursor-pointer'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer'
                  }`}
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Procesando...</span>
                    </>
                  ) : isCurrentPlan ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Plan Actual</span>
                      <span className="sm:hidden">Actual</span>
                    </>
                  ) : isSelected ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Seleccionado</span>
                      <span className="sm:hidden">OK</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Seleccionar Plan</span>
                      <span className="sm:hidden">Seleccionar</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={selectedPlan !== null && selectedPlan !== currentPlanId && !processingPlanId} onOpenChange={(open) => {
        if (!open && !processingPlanId) {
          setSelectedPlan(null)
        }
      }}>
        <DialogContent>
          <DialogHeader className="pr-8">
            <DialogTitle className="mb-2">¿Confirmar cambio de plan?</DialogTitle>
            <DialogDescription className="mt-2">
              El cambio se aplicará inmediatamente y se ajustará el prorrateo del pago.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              onClick={() => setSelectedPlan(null)}
              variant="outline"
              size="sm"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmChange}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Cambio'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}