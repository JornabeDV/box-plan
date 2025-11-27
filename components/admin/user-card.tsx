'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { AssignPlanModal } from './assign-plan-modal'
import { useToast } from '@/hooks/use-toast'
import { 
  User, 
  Mail, 
  Calendar
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
  coachId: string | null
  onAssignSubscription: (userId: string, planId: string, paymentMethod: string) => Promise<void>
  onCancelSubscription: (subscriptionId: string) => void
  onEditUser: (user: UserWithSubscription) => void
  onDeleteUser: (userId: string) => Promise<{ error: string | null }>
  onAssignmentComplete?: () => void
}

export function UserCard({ 
  user, 
  plans, 
  coachId,
  onAssignSubscription, 
  onCancelSubscription, 
  onEditUser,
  onDeleteUser,
  onAssignmentComplete
}: UserCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false)
  const [showCancelSubscriptionDialog, setShowCancelSubscriptionDialog] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  return (
    <>
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">
                {user.full_name || 'Sin nombre'}
              </CardTitle>
              <CardDescription className="flex items-center min-w-0">
                <Mail className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{user.email}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Badge variant={user.has_subscription ? 'default' : 'outline'} className="text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-1.5 whitespace-nowrap">
              {user.has_subscription 
                ? user.subscription?.plan?.name || 'Plan sin nombre'
                : user.subscription_status === 'canceled' 
                  ? 'Cancelado' 
                  : 'Sin plan'}
            </Badge>
            <Badge variant={
              user.subscription_status === 'active' ? 'default' :
              user.subscription_status === 'canceled' ? 'destructive' :
              user.subscription_status === 'past_due' ? 'destructive' :
              'secondary'
            } className="text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-1.5 whitespace-nowrap">
              {user.subscription_status === 'active' ? 'Activo' :
               user.subscription_status === 'canceled' ? 'Cancelado' :
               user.subscription_status === 'past_due' ? 'Vencido' :
               user.subscription_status === 'unpaid' ? 'Impago' :
               'Sin suscripción'}
            </Badge>
            {user.preferences?.discipline && (
              <Badge variant="outline" className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-1.5 whitespace-nowrap">
                <div 
                  className="w-2 sm:w-3 h-2 sm:h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: user.preferences.discipline.color }}
                />
                <span className="truncate">{user.preferences.discipline.name}</span>
              </Badge>
            )}
            {user.preferences?.level && (
              <Badge variant="secondary" className="text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-1.5 whitespace-nowrap">
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
          {user.subscription && user.subscription_status === 'active' && user.subscription.plan && (
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
          {user.subscription && user.subscription_status === 'canceled' && user.subscription.plan && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Última suscripción (cancelada):</span>
              <p className="text-muted-foreground text-xs">
                {user.subscription.plan.name} - Cancelada
              </p>
            </div>
          )}
          {/* Preferencias de disciplina y nivel */}
          {user.preferences && (user.preferences.discipline || user.preferences.level) && (
            <div className="text-sm">
              <span className="font-medium">Preferencias:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {user.preferences.discipline && (
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: user.preferences.discipline.color }}
                    />
                    <span className="text-muted-foreground">{user.preferences.discipline.name}</span>
                  </div>
                )}
                {user.preferences.level && (
                  <span className="text-muted-foreground">
                    {user.preferences.discipline ? ' - ' : ''}
                    {user.preferences.level.name}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {!user.has_subscription ? (
              plans.length > 0 ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setShowAssignPlanModal(true)}
                  className="hover:scale-100 active:scale-100"
                >
                  Asignar Plan
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  title="No hay planes disponibles. Crea planes en la base de datos."
                >
                  Sin planes disponibles
                </Button>
              )
            ) : (
              <>
                {user.subscription_status !== 'canceled' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => user.subscription && setShowCancelSubscriptionDialog(true)}
                    className="hover:scale-100 active:scale-100"
                  >
                    Cancelar Suscripción
                  </Button>
                )}
              </>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEditUser(user)}
              className="hover:scale-100 active:scale-100"
            >
              Preferencias
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="hover:scale-100 active:scale-100"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Modal para asignar plan */}
    <AssignPlanModal
      open={showAssignPlanModal}
      onOpenChange={(open) => {
        setShowAssignPlanModal(open)
        if (!open && onAssignmentComplete) {
          onAssignmentComplete()
        }
      }}
      user={user}
      plans={plans}
      onAssign={async (userId, planId, paymentMethod) => {
        await onAssignSubscription(userId, planId, paymentMethod)
        if (onAssignmentComplete) {
          onAssignmentComplete()
        }
      }}
    />

    {/* Diálogo de confirmación para cancelar suscripción */}
    <ConfirmationDialog
      open={showCancelSubscriptionDialog}
      onOpenChange={(open) => {
        if (!canceling) {
          setShowCancelSubscriptionDialog(open)
        }
      }}
      onConfirm={async () => {
        if (!user.subscription) return
        
        setCanceling(true)
        try {
          await onCancelSubscription(user.subscription.id)
          toast({
            title: 'Suscripción cancelada',
            description: `La suscripción del plan "${user.subscription.plan?.name || 'desconocido'}" ha sido cancelada inmediatamente para ${user.full_name || user.email}.`,
            variant: 'default'
          })
          setShowCancelSubscriptionDialog(false)
          // Notificar que se completó la cancelación para actualizar la lista
          if (onAssignmentComplete) {
            onAssignmentComplete()
          }
        } catch (error) {
          toast({
            title: 'Error al cancelar suscripción',
            description: error instanceof Error ? error.message : 'Ocurrió un error al cancelar la suscripción. Por favor, intenta nuevamente.',
            variant: 'destructive'
          })
        } finally {
          setCanceling(false)
        }
      }}
      title="Confirmar Cancelación de Suscripción"
      description={
        user.subscription
          ? `¿Estás seguro de que quieres cancelar la suscripción del plan "${user.subscription.plan?.name || 'desconocido'}" para ${user.full_name || user.email}? La suscripción se cancelará inmediatamente y el usuario perderá el acceso a las funcionalidades premium.`
          : ''
      }
      confirmText="Cancelar Suscripción"
      cancelText="No Cancelar"
      variant="destructive"
      loading={canceling}
    />

    {/* Diálogo de confirmación para eliminar usuario */}
    <ConfirmationDialog
      open={showDeleteDialog}
      onOpenChange={(open) => {
        if (!deleting) {
          setShowDeleteDialog(open)
        }
      }}
      onConfirm={async () => {
        setDeleting(true)
        const result = await onDeleteUser(user.id)
        setDeleting(false)
        
        if (result.error) {
          toast({
            title: 'Error al eliminar usuario',
            description: result.error,
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Usuario eliminado',
            description: `El usuario ${user.full_name || user.email} ha sido eliminado exitosamente.`,
            variant: 'default'
          })
          setShowDeleteDialog(false)
        }
      }}
      title="Eliminar Usuario"
      description={`¿Estás seguro de que quieres eliminar al usuario ${user.full_name || user.email}? Esta acción eliminará todos sus datos (suscripciones, preferencias, planificaciones asignadas, etc.) y no se puede deshacer.`}
      confirmText="Eliminar"
      cancelText="Cancelar"
      variant="destructive"
      loading={deleting}
    />
    </>
  )
}