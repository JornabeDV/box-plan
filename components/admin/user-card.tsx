'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { AssignPlanModal } from './assign-plan-modal'
import { ChangePlanModal } from './change-plan-modal'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  User, 
  Mail, 
  Calendar,
  ArrowRightLeft,
  RefreshCw
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
  onChangePlan?: (userId: string, newPlanId: string) => Promise<void>
  onReactivateSubscription?: (subscriptionId: string) => Promise<void>
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
  onChangePlan,
  onReactivateSubscription,
  onEditUser,
  onDeleteUser,
  onAssignmentComplete
}: UserCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [showCancelSubscriptionDialog, setShowCancelSubscriptionDialog] = useState(false)
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  // Determinar si la suscripción está pendiente de cancelación (cancelada pero aún activa)
  const isPendingCancellation = user.subscription?.cancel_at_period_end && user.subscription_status === 'active'
  // Determinar si la suscripción está cancelada/vencida (no mostrar botón cancelar, sí reactivar)
  const isCanceledOrExpired = user.subscription_status === 'canceled' || user.subscription_status === 'past_due' || user.subscription_status === 'unpaid'
  // Determinar si se puede reactivar (pendiente de cancelación, cancelada o vencida)
  const canReactivate = isPendingCancellation || isCanceledOrExpired

  return (
    <>
    <Card className="overflow-hidden max-sm:py-3 gap-3 sm:gap-6">
      <CardHeader className='max-sm:px-3'>
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
            {isPendingCancellation ? (
              <Badge 
                variant="outline" 
                className="text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-1.5 whitespace-nowrap bg-yellow-50 text-yellow-700 border-yellow-400"
              >
                Activo · Cancela {format(new Date(user.subscription!.current_period_end), 'dd/MM', { locale: es })}
              </Badge>
            ) : (
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
            )}
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
      <CardContent className='max-sm:px-3'>
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
              <p className={isPendingCancellation ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}>
                {isPendingCancellation 
                  ? `Acceso hasta: ${format(new Date(user.subscription.current_period_end), 'dd/MM/yyyy', { locale: es })}`
                  : `Vence: ${format(new Date(user.subscription.current_period_end), 'dd/MM/yyyy', { locale: es })}`
                }
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
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-between">
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
                {/* Solo mostrar Cancelar si no está cancelada ni pendiente de cancelación */}
                {!isCanceledOrExpired && !isPendingCancellation && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => user.subscription && setShowCancelSubscriptionDialog(true)}
                    className="hover:scale-100 active:scale-100"
                  >
                    Cancelar Suscripción
                  </Button>
                )}
                {/* Mostrar Cambiar Plan si hay suscripción activa */}
                {user.subscription_status === 'active' && onChangePlan && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowChangePlanModal(true)}
                    className="hover:scale-100 active:scale-100"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                    Cambiar Plan
                  </Button>
                )}
                {/* Mostrar Reactivar si está pendiente de cancelación, cancelada o vencida */}
                {canReactivate && onReactivateSubscription && user.subscription && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => setShowReactivateDialog(true)}
                    className="hover:scale-100 active:scale-100 bg-green-600 hover:bg-green-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Reactivar
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

    {/* Modal para cambiar plan */}
    {onChangePlan && (
      <ChangePlanModal
        open={showChangePlanModal}
        onOpenChange={(open) => {
          setShowChangePlanModal(open)
          if (!open && onAssignmentComplete) {
            onAssignmentComplete()
          }
        }}
        user={user}
        plans={plans}
        onChangePlan={async (userId, newPlanId) => {
          await onChangePlan(userId, newPlanId)
          if (onAssignmentComplete) {
            onAssignmentComplete()
          }
        }}
      />
    )}

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
          ? `¿Estás seguro de que quieres cancelar la suscripción del plan "${user.subscription.plan?.name || 'desconocido'}" para ${user.full_name || user.email}? La suscripción se cancelará al final del período actual (${format(new Date(user.subscription.current_period_end), 'dd/MM/yyyy', { locale: es })}).`
          : ''
      }
      confirmText="Cancelar Suscripción"
      cancelText="No Cancelar"
      variant="destructive"
      loading={canceling}
    />

    {/* Diálogo de confirmación para reactivar suscripción */}
    <ConfirmationDialog
      open={showReactivateDialog}
      onOpenChange={(open) => {
        if (!reactivating) {
          setShowReactivateDialog(open)
        }
      }}
      onConfirm={async () => {
        if (!user.subscription || !onReactivateSubscription) return
        
        setReactivating(true)
        try {
          await onReactivateSubscription(user.subscription.id)
          toast({
            title: 'Suscripción reactivada',
            description: `La suscripción del plan "${user.subscription.plan?.name || 'desconocido'}" ha sido reactivada para ${user.full_name || user.email}. Nuevo período: 30 días desde hoy.`,
            variant: 'default'
          })
          setShowReactivateDialog(false)
          // Notificar que se completó la reactivación para actualizar la lista
          if (onAssignmentComplete) {
            onAssignmentComplete()
          }
        } catch (error) {
          toast({
            title: 'Error al reactivar suscripción',
            description: error instanceof Error ? error.message : 'Ocurrió un error al reactivar la suscripción. Por favor, intenta nuevamente.',
            variant: 'destructive'
          })
        } finally {
          setReactivating(false)
        }
      }}
      title="Confirmar Reactivación de Suscripción"
      description={
        user.subscription
          ? `¿Estás seguro de que quieres reactivar la suscripción del plan "${user.subscription.plan?.name || 'desconocido'}" para ${user.full_name || user.email}? Se extenderá el período por 30 días desde hoy y el usuario recuperará el acceso inmediatamente.`
          : ''
      }
      confirmText="Reactivar Suscripción"
      cancelText="No Reactivar"
      variant="default"
      loading={reactivating}
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