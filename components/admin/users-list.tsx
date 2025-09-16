'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, User, Mail, Calendar, MoreHorizontal } from 'lucide-react'

interface UserAssignment {
  id: string
  admin_id: string
  user_id: string
  assigned_at: string
  is_active: boolean
  notes: string | null
  user: {
    id: string
    email: string
    created_at: string
  }
}

interface UsersListProps {
  adminId: string | null
}

export function UsersList({ adminId }: UsersListProps) {
  const [users, setUsers] = useState<UserAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (adminId) {
      loadUsers()
    }
  }, [adminId])

  const loadUsers = async () => {
    if (!adminId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('admin_user_assignments')
        .select(`
          *,
          user:auth.users(
            id,
            email,
            created_at
          )
        `)
        .eq('admin_id', adminId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })

      if (error) {
        console.error('Error loading users:', error)
        return
      }

      setUsers(data || [])
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>
          <User className="h-4 w-4 mr-2" />
          Asignar Usuario
        </Button>
      </div>

      {/* Lista de usuarios */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay usuarios asignados</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No se encontraron usuarios con ese criterio.' : 'Asigna usuarios para comenzar a gestionar sus entrenamientos.'}
          </p>
          <Button>
            <User className="h-4 w-4 mr-2" />
            Asignar Primer Usuario
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Usuario
                    </CardTitle>
                    <CardDescription className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {user.user.email}
                    </CardDescription>
                  </div>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Asignado: {new Date(user.assigned_at).toLocaleDateString()}</span>
                  </div>
                  {user.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Notas:</span>
                      <p className="text-muted-foreground mt-1">{user.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button size="sm" variant="outline">
                    Ver Planillas
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}