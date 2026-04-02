"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { SubscriptionStatus } from "@/components/dashboard/subscription-status";
import { useToast } from "@/hooks/use-toast";
import { useUserDisciplines } from "@/hooks/use-user-disciplines";
import {
  User,
  Mail,
  Calendar,
  Phone,
  ArrowLeft,
  Edit,
  Loader2,
  Dumbbell,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const {
    disciplines: userDisciplines,
    loading: userDisciplinesLoading,
  } = useUserDisciplines();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    avatar_url: profile?.avatar_url || "",
    phone: profile?.phone || "",
  });

  // Actualizar formData cuando el perfil cambie
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleEdit = () => {
    setFormData({
      full_name: profile?.full_name || "",
      avatar_url: profile?.avatar_url || "",
      phone: profile?.phone || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateProfile({
        full_name: formData.full_name || null,
        avatar_url: formData.avatar_url || null,
        phone: formData.phone || null,
      });

      if (result.error) {
        toast({
          title: "Error al actualizar",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Perfil actualizado",
          description: "Tu información se ha actualizado exitosamente",
        });
        setIsEditModalOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error al actualizar",
        description: "Ocurrió un error al actualizar tu perfil",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario después de cargar, mostrar error
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">
            No autorizado
          </h2>
          <p className="text-muted-foreground mb-4">
            No tienes acceso a esta página
          </p>
          <Button onClick={() => router.push("/")} className="neon-button">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="p-6 space-y-8 pb-32 max-w-2xl mx-auto">
        {/* Información Básica del Usuario */}
        <div>
          {/* Título */}
          <div className="mb-8">
            <div className="flex items-center gap-4 md:justify-between mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center gap-2 md:order-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <h1 className="text-3xl font-bold text-foreground md:order-1">
                Mi Perfil
              </h1>
            </div>
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
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-lg bg-secondary text-foreground">
                    {profile?.full_name?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {profile?.full_name || user?.name || "Usuario"}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium text-foreground">
                    {user?.email}
                  </span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Celular:</span>
                    <span className="text-sm font-medium text-foreground">
                      {profile.phone}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Miembro desde:
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {profile?.created_at
                      ? format(new Date(profile.created_at), "dd/MM/yyyy", {
                          locale: es,
                        })
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado de Suscripción */}
          <div className="mt-6">
            <SubscriptionStatus />
          </div>

          {/* Mis Disciplinas - Solo lectura para el estudiante */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Dumbbell className="h-5 w-5" />
                  Mis Disciplinas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estas son las disciplinas que tu coach te ha asignado.
                </p>
              </CardHeader>
              <CardContent>
                {userDisciplinesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">
                      Cargando disciplinas...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Lista de disciplinas asignadas - Solo lectura */}
                    {userDisciplines.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {userDisciplines.map((userDiscipline) => (
                          <div
                            key={userDiscipline.id}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border"
                          >
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: userDiscipline.discipline?.color || '#3B82F6',
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {userDiscipline.discipline?.name || 'Disciplina'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {userDiscipline.level?.name || 'Sin nivel asignado'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No tienes disciplinas asignadas</p>
                        <p className="text-sm mt-1">
                          Tu coach te asignará las disciplinas correspondientes
                        </p>
                      </div>
                    )}
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
              Actualiza tu información personal. Los cambios se guardarán en tu
              perfil.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Ingresa tu nombre completo"
              />
            </div>
            <div className="grid gap-2 hidden">
              <Label htmlFor="avatar_url">URL del Avatar</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                placeholder="https://ejemplo.com/avatar.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Ingresa la URL de tu imagen de perfil
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Celular</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+54 9 11 1234-5678"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
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
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
