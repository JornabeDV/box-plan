'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SubscriptionPlanModal } from './subscription-plan-modal'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useSubscriptionPlans, SubscriptionPlan as PlanType } from '@/hooks/use-subscription-plans'
import { Plus, Edit, Trash2, DollarSign, Calendar } from 'lucide-react'

export function SubscriptionPlansList() {
  const { plans, loading, deletePlan } = useSubscriptionPlans()
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<PlanType | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleCreatePlan = () => {
    setSelectedPlan(null)
    setShowModal(true)
  }

  const handleEditPlan = (plan: PlanType) => {
    setSelectedPlan(plan)
    setShowModal(true)
  }

  const handleDeletePlan = (plan: PlanType) => {
    setPlanToDelete(plan)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!planToDelete) return

    setDeleting(true)
    const result = await deletePlan(planToDelete.id)
    setDeleting(false)

    if (result.success) {
      setShowDeleteDialog(false)
      setPlanToDelete(null)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando planes...</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Planes de Suscripción</h2>
            <p className="text-muted-foreground">
              Gestiona los planes de suscripción disponibles para los usuarios
            </p>
          </div>
          <Button onClick={handleCreatePlan}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Plan
          </Button>
        </div>

        {/* Lista de planes */}
        {plans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No hay planes de suscripción creados</p>
              <Button onClick={handleCreatePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {plan.description || 'Sin descripción'}
                      </CardDescription>
                    </div>
                    {plan.is_active ? (
                      <Badge variant="default" className="ml-2">Activo</Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">Inactivo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Precio */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground capitalize">
                          {plan.interval}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Características:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {plan.features.slice(0, 3).map((feature: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                          {plan.features.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{plan.features.length - 3} más
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePlan(plan)}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de crear/editar plan */}
      <SubscriptionPlanModal
        open={showModal}
        onOpenChange={setShowModal}
        plan={selectedPlan}
      />

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!deleting) {
            setShowDeleteDialog(open)
          }
        }}
        onConfirm={confirmDelete}
        title="Eliminar Plan"
        description={`¿Estás seguro de que quieres eliminar el plan "${planToDelete?.name}"? Esta acción desactivará el plan y los usuarios no podrán seleccionarlo.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleting}
      />
    </>
  )
}