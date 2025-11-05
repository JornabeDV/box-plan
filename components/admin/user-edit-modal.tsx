'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X } from 'lucide-react'
import { useDisciplines } from '@/hooks/use-disciplines'
import { useUserPreferences } from '@/hooks/use-user-preferences'

interface UserEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
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
  } | null
  adminId: string | null
  onUserUpdated?: () => void
}

export function UserEditModal({ open, onOpenChange, user, adminId, onUserUpdated }: UserEditModalProps) {
  const { disciplines, disciplineLevels } = useDisciplines(adminId)
  const { updateUserPreferences } = useUserPreferences(adminId)
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    preferred_discipline_id: '',
    preferred_level_id: ''
  })

  // Actualizar formData cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        preferred_discipline_id: user.preferences?.preferred_discipline_id || 'none',
        preferred_level_id: user.preferences?.preferred_level_id || 'none'
      })
    }
  }, [user])

  const getDisciplineLevels = (disciplineId: string | null) => {
    if (!disciplineId) return []
    return disciplineLevels.filter(level => level.discipline_id === disciplineId)
  }

  const handleDisciplineChange = (disciplineId: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_discipline_id: disciplineId === 'none' ? '' : disciplineId,
      preferred_level_id: '' // Reset level when discipline changes
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Actualizar perfil del usuario (full_name)
      const profileUpdateResponse = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name || null
        })
      })

      if (!profileUpdateResponse.ok) {
        const errorData = await profileUpdateResponse.json()
        throw new Error(errorData.error || 'Error al actualizar perfil')
      }

      // Actualizar preferencias de usuario
      const result = await updateUserPreferences(user.id, {
        preferred_discipline_id: formData.preferred_discipline_id === 'none' ? null : formData.preferred_discipline_id || null,
        preferred_level_id: formData.preferred_level_id === 'none' ? null : formData.preferred_level_id || null
      })

      if (!result.error) {
        // Cerrar el modal
        onOpenChange(false)
        // Actualizar la lista de usuarios
        if (onUserUpdated) {
          onUserUpdated()
        }
      }
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setLoading(false)
    }
  }

  const availableLevels = getDisciplineLevels(formData.preferred_discipline_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Usuario
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información básica del usuario */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Nombre del usuario"
            />
          </div>

          {/* Disciplina preferida */}
          <div className="space-y-2">
            <Label>Disciplina Preferida</Label>
            <Select
              value={formData.preferred_discipline_id}
              onValueChange={handleDisciplineChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {disciplines.map((discipline) => (
                  <SelectItem key={discipline.id} value={discipline.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: discipline.color }}
                      />
                      {discipline.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nivel preferido */}
          <div className="space-y-2">
            <Label>Nivel Preferido</Label>
            <Select
              value={formData.preferred_level_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_level_id: value === 'none' ? '' : value }))}
              disabled={!formData.preferred_discipline_id || formData.preferred_discipline_id === 'none'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {availableLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(!formData.preferred_discipline_id || formData.preferred_discipline_id === 'none') && (
              <p className="text-sm text-muted-foreground">
                Selecciona una disciplina para habilitar la selección de nivel.
              </p>
            )}
          </div>

          {/* Estado actual de las preferencias */}
          {user?.preferences && (
            <div className="space-y-2">
              <Label>Estado Actual</Label>
              <div className="flex flex-wrap gap-2">
                {user.preferences.discipline ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: user.preferences.discipline.color }}
                    />
                    {user.preferences.discipline.name}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Sin disciplina</Badge>
                )}
                {user.preferences.level ? (
                  <Badge variant="outline">{user.preferences.level.name}</Badge>
                ) : (
                  <Badge variant="secondary">Sin nivel</Badge>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}