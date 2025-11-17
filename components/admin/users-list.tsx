'use client'

import { useState } from 'react'
import { User } from 'lucide-react'
import { UserCard } from './user-card'
import { UserFilters } from './user-filters'
import { UserEditModal } from './user-edit-modal'
import { useUsersManagement } from '@/hooks/use-users-management'

interface UsersListProps {
  coachId: string | null
  initialUsers?: any[]
  initialPlans?: any[]
  onRefresh?: () => void
}

export function UsersList({ coachId, initialUsers, initialPlans, onRefresh }: UsersListProps) {
  const { users: hookUsers, plans: hookPlans, loading, assignSubscription, cancelSubscription, deleteUser, loadUsers } = useUsersManagement(coachId)
  
  // Priorizar datos del hook si están disponibles (indica que se han cargado/actualizado)
  // Usar datos iniciales solo como fallback inicial antes de que el hook cargue
  // Esto asegura que después de actualizaciones (cancelar, asignar, etc.), siempre se usen los datos más recientes
  const users = (hookUsers && hookUsers.length > 0) ? hookUsers : (initialUsers || hookUsers || [])
  const plans = (hookPlans && hookPlans.length > 0) ? hookPlans : (initialPlans || hookPlans || [])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesPlan = selectedPlan === 'all' || 
      (user.subscription?.plan_id && String(user.subscription.plan_id) === selectedPlan) ||
      (selectedPlan === 'sin_plan' && !user.has_subscription)
    
    const matchesStatus = selectedStatus === 'all' || 
      user.subscription_status === selectedStatus

    return matchesSearch && matchesPlan && matchesStatus
  })

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedUser(null)
  }

  const handleUserUpdated = async () => {
    // Pequeño delay para asegurar que la actualización en la BD se complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (onRefresh) {
      onRefresh()
    } else {
      // Forzar refresh y esperar a que termine
      await loadUsers(true)
    }
  }

  // Solo mostrar loading si no hay datos iniciales y está cargando
  if (!initialUsers && loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <UserFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPlan={selectedPlan}
        onPlanChange={setSelectedPlan}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        plans={plans}
      />

      {/* Lista de usuarios */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay usuarios</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedPlan !== 'all' || selectedStatus !== 'all' 
              ? 'No se encontraron usuarios con esos criterios.' 
              : 'Aún no hay usuarios registrados.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              plans={plans}
              coachId={coachId}
              onAssignSubscription={assignSubscription}
              onCancelSubscription={cancelSubscription}
              onEditUser={handleEditUser}
              onDeleteUser={deleteUser}
              onAssignmentComplete={handleUserUpdated}
            />
          ))}
        </div>
      )}

      {/* Modal de edición de usuario */}
      <UserEditModal
        open={showEditModal}
        onOpenChange={handleCloseEditModal}
        user={selectedUser}
        coachId={coachId}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  )
}