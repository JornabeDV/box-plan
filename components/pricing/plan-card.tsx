'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap } from 'lucide-react'
import { Plan, formatPrice, getYearlyPrice } from '@/lib/plans'

interface PlanCardProps {
  plan: Plan
  isYearly: boolean
  onSelect: (planId: string) => void
  loading?: boolean
  currentPlan?: boolean
}

export function PlanCard({ plan, isYearly, onSelect, loading = false, currentPlan = false }: PlanCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const price = isYearly ? getYearlyPrice(plan.price) : plan.price
  const displayPrice = isYearly ? price / 12 : plan.price
  const savings = isYearly ? plan.price * 12 - price : 0

  const getColorClasses = () => {
    switch (plan.color) {
      case 'blue':
        return {
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'purple':
        return {
          gradient: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          button: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'gold':
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

  const colors = getColorClasses()

  return (
    <Card 
      className={`relative transition-all duration-300 ${
        plan.popular 
          ? 'ring-2 ring-purple-500 shadow-lg scale-105' 
          : 'hover:shadow-lg hover:scale-105'
      } ${currentPlan ? 'ring-2 ring-green-500' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-purple-600 text-white px-4 py-1">
            <Star className="w-3 h-3 mr-1" />
            Más Popular
          </Badge>
        </div>
      )}

      {currentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-green-600 text-white px-3 py-1">
            <Check className="w-3 h-3 mr-1" />
            Actual
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${colors.bg} flex items-center justify-center text-3xl`}>
          {plan.icon}
        </div>
        
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-base">{plan.description}</CardDescription>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold">{formatPrice(displayPrice)}</span>
            <span className="text-gray-500 ml-1">/mes</span>
          </div>
          
          {isYearly && savings > 0 && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                Ahorras {formatPrice(savings)}/año
              </Badge>
            </div>
          )}
          
          {isYearly && (
            <p className="text-sm text-gray-500 mt-1">
              Facturado anualmente ({formatPrice(price)}/año)
            </p>
          )}
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
          onClick={() => onSelect(plan.id)}
          disabled={loading || currentPlan}
          className={`w-full ${colors.button} text-white ${
            currentPlan ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          size="lg"
        >
          {loading ? (
            <Zap className="w-4 h-4 mr-2 animate-spin" />
          ) : currentPlan ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Plan Actual
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
}