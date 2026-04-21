"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { SubscriptionStatus } from "@/components/dashboard/subscription-status";
import { PushNotificationButton } from "@/components/pwa/push-notification-button";
import { PushNotificationGuide } from "@/components/pwa/push-notification-guide";
import { useToast } from "@/hooks/use-toast";
import { useUserDisciplines } from "@/hooks/use-user-disciplines";
import { useProgressStats } from "@/hooks/use-progress-stats";
import {
  User,
  Loader2,
  Dumbbell,
  Bell,
  Palette,
  LogOut,
  Trophy,
  Flame,
  Weight,
  Zap,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const { disciplines: userDisciplines, loading: userDisciplinesLoading } =
    useUserDisciplines();
  const { stats } = useProgressStats(user?.id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    avatar_url: profile?.avatar_url || "",
    phone: profile?.phone || "",
  });

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

  if (authLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background text-foreground flex items-center justify-center">
        <div
          className="absolute inset-0 kinetic-grid-bg pointer-events-none"
          aria-hidden="true"
        />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">
            No autorizado
          </h2>
          <p className="text-muted-foreground mb-4">
            No tienes acceso a esta página
          </p>
          <Button onClick={() => router.push("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 kinetic-grid-bg pointer-events-none"
        aria-hidden="true"
      />

      <main className="px-5 py-6 space-y-8 pb-24 max-w-md mx-auto md:max-w-2xl">
        {/* Header info */}
        <div className="space-y-2">
          <span className="label-md text-primary tracking-[0.2em]">Atleta</span>
          <h2 className="display-lg text-foreground uppercase">
            <span className="italic">
              {profile?.full_name || user?.name || "Atleta"}
            </span>
          </h2>
          <p className="body-lg text-muted-foreground text-foreground">
            Miembro desde{" "}
            {profile?.created_at
              ? format(new Date(profile.created_at), "MMM yyyy", { locale: es })
              : "N/A"}
          </p>
        </div>

        <Card>
          <div>
            <Button
              variant="ghost"
              onClick={handleEdit}
              className="w-full h-auto justify-start gap-4 rounded-2xl bg-surface-container px-4 hover:bg-surface-container-high py-0"
            >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Mi cuenta</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </Card>

        <SubscriptionStatus />

        {/* Notificaciones Push */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  Notificaciones
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Recibí avisos de tu coach aunque la app esté cerrada.
                </p>
              </div>
              <PushNotificationButton />
            </div>
            <PushNotificationGuide />
          </CardContent>
        </Card>

        {/* Disciplinas */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Mis Disciplinas</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Estas son las disciplinas que tu coach te ha asignado.
            </p>

            {userDisciplinesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">
                  Cargando disciplinas...
                </span>
              </div>
            ) : userDisciplines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {userDisciplines.map((userDiscipline) => (
                  <div
                    key={userDiscipline.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-high border border-outline/10"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          userDiscipline.discipline?.color || "#3B82F6",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {userDiscipline.discipline?.name || "Disciplina"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userDiscipline.level?.name || "Sin nivel asignado"}
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
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="outline"
          onClick={() => signOut?.()}
          className="w-full h-auto py-4 text-destructive border-destructive/30 hover:bg-destructive/5 border-2"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
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
