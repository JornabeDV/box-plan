'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  User, 
  Mail, 
  Calendar, 
  MoreHorizontal, 
  Settings, 
  CreditCard, 
  FileText 
} from 'lucide-react'

interface UserWithSubscription {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  subscription?: {
    id: string
    user_id: string
    plan_id: string
    status: 'active' | 'canceled' | 'past_due' | 'unpaid'
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
    plan: {
      id: string
      name: string
      description: string | null
      price: number
      currency: string
      interval: string
      features: any
      is_active: boolean
    }
  } | null
  has_subscription: boolean
  subscription_status?: string
  preferences?: {
    id: string
    preferred_discipline_id: string | null
    preferred_level_id: string | null
    discipline?: {
      id: string
      name: string
      color: string
    }
    level?: {
      id: string
      name: string
      description: string | null
    }
  } | null
}

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

interface UserCardProps {
  user: UserWithSubscription
  plans: SubscriptionPlan[]
  onAssignSubscription: (userId: string, planId: string) => void
  onCancelSubscription: (subscriptionId: string) => void
  onEditUser: (user: UserWithSubscription) => void
}

export function UserCard({ 
  user, 
  plans, 
  onAssignSubscription, 
  onCancelSubscription, 
  onEditUser 
}: UserCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {user.full_name || 'Sin nombre'}
              </CardTitle>
              <CardDescription className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {user.email}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={user.has_subscription ? 'default' : 'outline'}>
              {user.has_subscription ? user.subscription?.plan.name : 'Sin plan'}
            </Badge>
            <Badge variant={
              user.subscription_status === 'active' ? 'default' :
              user.subscription_status === 'canceled' ? 'destructive' :
              user.subscription_status === 'past_due' ? 'destructive' :
              'secondary'
            }>
              {user.subscription_status === 'active' ? 'Activo' :
               user.subscription_status === 'canceled' ? 'Cancelado' :
               user.subscription_status === 'past_due' ? 'Vencido' :
               user.subscription_status === 'unpaid' ? 'Impago' :
               'Sin suscripción'}
            </Badge>
            {user.preferences?.discipline && (
              <Badge variant="outline" className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: user.preferences.discipline.color }}
                />
                {user.preferences.discipline.name}
              </Badge>
            )}
            {user.preferences?.level && (
              <Badge variant="secondary">
                {user.preferences.level.name}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Registrado: {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          {user.subscription && (
            <div className="text-sm">
              <span className="font-medium">Suscripción:</span>
              <p className="text-muted-foreground">
                {user.subscription.plan.name} - 
                ${user.subscription.plan.price}/{user.subscription.plan.interval}
              </p>
              <p className="text-muted-foreground">
                Vence: {new Date(user.subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex gap-2">
            {!user.has_subscription ? (
              <Select onValueChange={(planId) => onAssignSubscription(user.id, planId)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Asignar plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}/{plan.interval}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Asignar Planillas
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => user.subscription && onCancelSubscription(user.subscription.id)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Cancelar Suscripción
                </Button>
              </>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEditUser(user)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Preferencias
            </Button>
          </div>
          <Button size="sm" variant="outline">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}