'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Save, User, X } from 'lucide-react'
import { useUserPreferences, UserWithPreferences, UpdateUserPreferenceData } from '@/hooks/use-user-preferences'
import { useDisciplines } from '@/hooks/use-disciplines'

interface UsersPreferencesProps {
  adminId: string | null
}

export function UsersPreferences({ adminId }: UsersPreferencesProps) {
  const { users, loading, error, updateUserPreferences } = useUserPreferences(adminId)
  const { disciplines, disciplineLevels } = useDisciplines(adminId)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [tempPreferences, setTempPreferences] = useState<Record<string, UpdateUserPreferenceData>>({})

  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setEditingUser(userId)
      setTempPreferences({
        [userId]: {
          preferred_discipline_id: user.preferences?.preferred_discipline_id || null,
          preferred_level_id: user.preferences?.preferred_level_id || null
        }
      })
    }
  }

  const handleCancelEdit = (userId: string) => {
    setEditingUser(null)
    setTempPreferences(prev => {
      const newPrefs = { ...prev }
      delete newPrefs[userId]
      return newPrefs
    })
  }

  const handlePreferenceChange = (userId: string, field: 'preferred_discipline_id' | 'preferred_level_id', value: string | null) => {
    setTempPreferences(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
        // Si cambia la disciplina, resetear el nivel
        ...(field === 'preferred_discipline_id' ? { preferred_level_id: null } : {})
      }
    }))
  }

  const handleSavePreferences = async (userId: string) => {
    setSaving(userId)
    try {
      const preferences = tempPreferences[userId]
      if (preferences) {
        const result = await updateUserPreferences(userId, preferences)
        if (!result.error) {
          setEditingUser(null)
          setTempPreferences(prev => {
            const newPrefs = { ...prev }
            delete newPrefs[userId]
            return newPrefs
          })
        }
      }
    } finally {
      setSaving(null)
    }
  }

  const getDisciplineLevels = (disciplineId: string | null) => {
    if (!disciplineId) return []
    return disciplineLevels.filter(level => level.discipline_id === disciplineId)
  }

  const getDisciplineName = (disciplineId: string | null) => {
    if (!disciplineId) return 'Sin asignar'
    const discipline = disciplines.find(d => d.id === disciplineId)
    return discipline?.name || 'Disciplina no encontrada'
  }

  const getLevelName = (levelId: string | null) => {
    if (!levelId) return 'Sin asignar'
    const level = disciplineLevels.find(l => l.id === levelId)
    return level?.name || 'Nivel no encontrado'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Cargando usuarios...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error al cargar usuarios: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Gestión de Usuarios y Preferencias
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Asigna disciplina y nivel preferido a cada usuario para la asignación automática de planificaciones.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay usuarios asignados a tu cuenta de administrador.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => {
              const isEditing = editingUser === user.id
              const preferences = isEditing ? tempPreferences[user.id] : user.preferences
              const availableLevels = getDisciplineLevels(preferences?.preferred_discipline_id || null)

              return (
                <div key={user.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {user.full_name || 'Usuario sin nombre'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSavePreferences(user.id)}
                            disabled={saving === user.id}
                          >
                            {saving === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelEdit(user.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user.id)}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Disciplina */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Disciplina Preferida</label>
                      {isEditing ? (
                        <Select
                          value={preferences?.preferred_discipline_id || ''}
                          onValueChange={(value) => handlePreferenceChange(
                            user.id, 
                            'preferred_discipline_id', 
                            value || null
                          )}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar disciplina" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sin asignar</SelectItem>
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
                      ) : (
                        <div className="flex items-center gap-2">
                          {user.preferences?.discipline ? (
                            <>
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: user.preferences.discipline.color }}
                              />
                              <span>{user.preferences.discipline.name}</span>
                            </>
                          ) : (
                            <Badge variant="secondary">Sin asignar</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Nivel */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nivel Preferido</label>
                      {isEditing ? (
                        <Select
                          value={preferences?.preferred_level_id || ''}
                          onValueChange={(value) => handlePreferenceChange(
                            user.id, 
                            'preferred_level_id', 
                            value || null
                          )}
                          disabled={!preferences?.preferred_discipline_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar nivel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sin asignar</SelectItem>
                            {availableLevels.map((level) => (
                              <SelectItem key={level.id} value={level.id}>
                                {level.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          {user.preferences?.level ? (
                            <Badge variant="outline">{user.preferences.level.name}</Badge>
                          ) : (
                            <Badge variant="secondary">Sin asignar</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && !preferences?.preferred_discipline_id && (
                    <p className="text-sm text-muted-foreground">
                      Selecciona una disciplina para habilitar la selección de nivel.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
