'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  interval: string
  features: any
  is_active: boolean
}

interface UserFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedPlan: string
  onPlanChange: (plan: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  plans: SubscriptionPlan[]
}

export function UserFilters({
  searchQuery,
  onSearchChange,
  selectedPlan,
  onPlanChange,
  selectedStatus,
  onStatusChange,
  plans
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar usuarios por nombre o email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={selectedPlan} onValueChange={onPlanChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filtrar por plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los planes</SelectItem>
          <SelectItem value="sin_plan">Sin plan</SelectItem>
          {plans.map((plan) => (
            <SelectItem key={plan.id} value={String(plan.id)}>
              {plan.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="active">Activo</SelectItem>
          <SelectItem value="canceled">Cancelado</SelectItem>
          <SelectItem value="past_due">Vencido</SelectItem>
          <SelectItem value="unpaid">Impago</SelectItem>
          <SelectItem value="sin_suscripcion">Sin suscripción</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}