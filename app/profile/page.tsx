"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { SubscriptionStatus } from "@/components/dashboard/subscription-status"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUserPreferences } from "@/hooks/use-current-user-preferences"
import { useUserCoach } from "@/hooks/use-user-coach"
import { useDisciplines } from "@/hooks/use-disciplines"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { 
  User, 
  Mail, 
  Calendar, 
  ArrowLeft,
  Edit,
  Loader2,
  Target
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, updateProfile, loading: profileLoading } = useProfile()
  const { toast } = useToast()
  const { preferences, loading: preferencesLoading, refetch: refetchPreferences, updatePreferences } = useCurrentUserPreferences()
  const { coach: userCoach, loading: coachLoading } = useUserCoach()
  const { disciplines, disciplineLevels, loading: disciplinesLoading } = useDisciplines(
    userCoach?.id ? userCoach.id.toString() : null
  )
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(null)
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || ''
  })

  // Actualizar formData cuando el perfil cambie
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile])

  // Cargar preferencias existentes cuando se carguen
  useEffect(() => {
    if (preferences && !preferencesLoading) {
      setSelectedDisciplineId(preferences.preferredDisciplineId)
      setSelectedLevelId(preferences.preferredLevelId)
    }
  }, [preferences, preferencesLoading])

  // Obtener niveles filtrados por disciplina seleccionada
  const availableLevels = selectedDisciplineId
    ? disciplineLevels.filter(level => level.discipline_id === selectedDisciplineId.toString())
    : []

  const handleDisciplineSelect = (value: string) => {
    const disciplineId = value === '' ? null : parseInt(value, 10)
    setSelectedDisciplineId(disciplineId)
    // Resetear nivel cuando cambia la disciplina
    setSelectedLevelId(null)
  }

  const handleLevelSelect = (value: string) => {
    const levelId = value === '' ? null : parseInt(value, 10)
    setSelectedLevelId(levelId)
  }

  const handleSavePreferences = async () => {
    if (!selectedDisciplineId || !selectedLevelId) {
      toast({
        title: 'Selección incompleta',
        description: 'Por favor, selecciona una disciplina y un nivel',
        variant: 'destructive'
      })
      return
    }

    setSavingPreferences(true)
    const result = await updatePreferences(selectedDisciplineId, selectedLevelId)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive'
      })
    } else {
      toast({
        title: "Preferencias actualizadas",
        description: "Tus preferencias han sido guardadas correctamente",
      })
      refetchPreferences()
    }

    setSavingPreferences(false)
  }

  const handleEdit = () => {
    setFormData({
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url || ''
    })
    setIsEditModalOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateProfile({
        full_name: formData.full_name || null,
        avatar_url: formData.avatar_url || null
      })

      if (result.error) {
        toast({
          title: "Error al actualizar",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Perfil actualizado",
          description: "Tu información se ha actualizado exitosamente",
        })
        setIsEditModalOpen(false)
      }
    } catch (error) {
      toast({
        title: "Error al actualizar",
        description: "Ocurrió un error al actualizar tu perfil",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario después de cargar, mostrar error
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">No autorizado</h2>
          <p className="text-muted-foreground mb-4">No tienes acceso a esta página</p>
          <Button onClick={() => router.push('/')} className="neon-button">
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-32">
        {/* Información Básica del Usuario */}
        <div className="max-w-2xl mx-auto">
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-lg bg-secondary text-foreground">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {profile?.full_name || user?.name || 'Usuario'}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium text-foreground">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Miembro desde:</span>
                  <span className="text-sm font-medium text-foreground">
                    {profile?.created_at ? format(new Date(profile.created_at), 'dd/MM/yyyy', { 
                      locale: es 
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado de Suscripción */}
          <div className="mt-6">
            <SubscriptionStatus />
          </div>

          {/* Preferencias de Entrenamiento */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Target className="h-5 w-5" />
                  Preferencias de Entrenamiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preferencesLoading || coachLoading || disciplinesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Cargando preferencias...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Mostrar preferencias actuales si existen */}
                    {preferences && preferences.preferredDisciplineId && preferences.preferredLevelId && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-border">
                        <div>
                          <p className="text-sm text-muted-foreground">Disciplina preferida</p>
                          <p className="text-base font-semibold text-foreground">
                            {preferences.discipline?.name || 'No especificada'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Nivel preferido</p>
                          <p className="text-base font-semibold text-foreground">
                            {preferences.level?.name || 'No especificado'}
                          </p>
                          {preferences.level?.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {preferences.level.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selectores de preferencias */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile-discipline-select" className="text-sm font-semibold text-foreground">
                            {preferences?.preferredDisciplineId ? 'Cambiar Disciplina' : 'Selecciona tu Disciplina'}
                          </Label>
                          <Select
                            value={selectedDisciplineId?.toString() || ''}
                            onValueChange={handleDisciplineSelect}
                          >
                            <SelectTrigger id="profile-discipline-select">
                              <SelectValue placeholder="Selecciona una disciplina" />
                            </SelectTrigger>
                            <SelectContent>
                              {disciplines.map((discipline) => (
                                <SelectItem key={discipline.id} value={discipline.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full border"
                                      style={{
                                        backgroundColor: discipline.color,
                                        borderColor: discipline.color
                                      }}
                                    />
                                    <span>{discipline.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="profile-level-select" className="text-sm font-semibold text-foreground">
                            {preferences?.preferredLevelId ? 'Cambiar Nivel' : 'Selecciona tu Nivel'}
                          </Label>
                          <Select
                            value={selectedLevelId?.toString() || ''}
                            onValueChange={handleLevelSelect}
                            disabled={!selectedDisciplineId || availableLevels.length === 0}
                          >
                            <SelectTrigger id="profile-level-select">
                              <SelectValue placeholder={
                                !selectedDisciplineId
                                  ? 'Primero selecciona una disciplina'
                                  : availableLevels.length === 0
                                    ? 'No hay niveles disponibles'
                                    : 'Selecciona un nivel'
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {availableLevels.map((level) => (
                                <SelectItem key={level.id} value={level.id}>
                                  {level.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {!selectedDisciplineId && (
                        <p className="text-xs text-muted-foreground">
                          Selecciona una disciplina para habilitar la selección de nivel
                        </p>
                      )}

                      {/* Botón Guardar */}
                      <Button
                        onClick={handleSavePreferences}
                        disabled={!selectedDisciplineId || !selectedLevelId || savingPreferences}
                        className="w-full"
                        size="lg"
                      >
                        {savingPreferences ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Target className="w-4 h-4 mr-2" />
                            {preferences?.preferredDisciplineId ? 'Actualizar Preferencias' : 'Guardar Preferencias'}
                          </>
                        )}
                      </Button>
                      {selectedDisciplineId && !selectedLevelId && (
                        <p className="text-xs text-muted-foreground text-center">
                          Por favor, selecciona un nivel para continuar
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNavigation />

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Actualiza tu información personal. Los cambios se guardarán en tu perfil.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ingresa tu nombre completo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="avatar_url">URL del Avatar</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://ejemplo.com/avatar.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Ingresa la URL de tu imagen de perfil
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}