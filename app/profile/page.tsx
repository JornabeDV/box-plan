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
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { useProgressStats } from "@/hooks/use-progress-stats";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Eye,
  EyeOff,
  Target,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RequireActiveSubscription } from "@/components/auth/require-active-subscription";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const { disciplines: userDisciplines, loading: userDisciplinesLoading, updatePreferredLevel, refetch } =
    useUserDisciplines();
  const { hasPersonalizedWorkouts, loading: subscriptionLoading } = useStudentSubscription();
  const { stats } = useProgressStats(user?.id ? String(user.id) : undefined);

  // Niveles por disciplina para "Mis Niveles"
  const [levelsByDiscipline, setLevelsByDiscipline] = useState<
    Record<number, Array<{ id: number; name: string }>>
  >({});
  // Estado local para niveles pendientes de guardar (sin auto-guardar)
  const [pendingLevels, setPendingLevels] = useState<Record<number, number>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  useEffect(() => {
    if (userDisciplines.length === 0) return;

    const loadLevels = async () => {
      const map: Record<number, Array<{ id: number; name: string }>> = {};
      for (const ud of userDisciplines) {
        try {
          const res = await fetch(`/api/disciplines/${ud.disciplineId}`);
          const data = await res.json();
          if (data.levels && Array.isArray(data.levels)) {
            map[ud.disciplineId] = data.levels.sort(
              (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
            );
          }
        } catch (e) {
          console.error("Error loading levels for discipline", ud.disciplineId);
        }
      }
      setLevelsByDiscipline(map);
    };

    loadLevels();
  }, [userDisciplines]);

  // Inicializar pendingLevels cuando cargan las disciplinas
  useEffect(() => {
    const map: Record<number, number> = {};
    userDisciplines.forEach((ud) => {
      const levelId = ud.preferredLevelId ?? ud.levelId;
      if (levelId) {
        map[ud.disciplineId] = levelId;
      }
    });
    setPendingLevels(map);
  }, [userDisciplines]);

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      const changes = userDisciplines.filter((ud) => {
        const currentLevelId = ud.preferredLevelId ?? ud.levelId;
        return pendingLevels[ud.disciplineId] !== currentLevelId;
      });

      if (changes.length === 0) {
        toast({ title: "Sin cambios", description: "No hay niveles modificados." });
        setIsSavingAll(false);
        return;
      }

      const results = await Promise.all(
        changes.map((ud) =>
          updatePreferredLevel({
            userDisciplineId: ud.id,
            preferredLevelId: pendingLevels[ud.disciplineId],
          })
        )
      );

      const hasError = results.some((r) => r.error);
      if (hasError) {
        toast({
          title: "Error",
          description: "No se pudieron guardar todos los cambios.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cambios guardados",
          description: "Tus niveles se actualizaron correctamente.",
        });
      }

      // Refrescar para sincronizar el estado
      await refetch();
    } catch {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    avatar_url: profile?.avatar_url || "",
    phone: profile?.phone || "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    setPasswordData({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: any = {
        full_name: formData.full_name || null,
        avatar_url: formData.avatar_url || null,
        phone: formData.phone || null,
      };

      const isChangingPassword =
        passwordData.current_password ||
        passwordData.new_password ||
        passwordData.confirm_password;

      if (isChangingPassword) {
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
          toast({
            title: "Error de validación",
            description: "Completá todos los campos de contraseña",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
          toast({
            title: "Error de validación",
            description: "Las contraseñas nuevas no coinciden",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
        if (passwordData.new_password.length < 6) {
          toast({
            title: "Error de validación",
            description: "La nueva contraseña debe tener al menos 6 caracteres",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
        updates.current_password = passwordData.current_password;
        updates.new_password = passwordData.new_password;
      }

      const result = await updateProfile(updates);

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
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
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
      <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground flex items-center justify-center">
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
      <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground flex items-center justify-center">
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
    <RequireActiveSubscription>
    <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 kinetic-grid-bg pointer-events-none"
        aria-hidden="true"
      />

      <main className="px-5 py-6 space-y-8 pb-[calc(5rem+env(safe-area-inset-bottom))] max-w-md mx-auto md:max-w-2xl">
        {/* Header info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/')}
              className="h-11 w-11 rounded-none bg-primary/5 border-primary/50 text-primary hover:bg-primary/10 shrink-0"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
                Atleta
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold italic text-primary">
                Perfil
              </h1>
            </div>
          </div>
        </div>

        <Card>
          <div>
            <Button
              variant="ghost"
              onClick={handleEdit}
              className="w-full h-auto justify-start gap-4 bg-surface-container px-4 hover:bg-surface-container-high py-0"
            >
              <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
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

        {/* Disciplinas (solo si no es plan personalizado) */}
        {!hasPersonalizedWorkouts && (
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Mis Disciplinas</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Estas son las disciplinas que tu coach te ha asignado.
              </p>

              {userDisciplinesLoading || subscriptionLoading ? (
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
                      className="flex items-center gap-3 p-3 rounded-none bg-surface-container-high border border-outline/10"
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
        )}

        {/* Mis Niveles (solo si no es plan personalizado) */}
        {!hasPersonalizedWorkouts && (
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Mis Niveles</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Elegí el nivel en el que querés entrenar para cada disciplina. Si
                no hay planificación para ese nivel, se mostrará la disponible.
              </p>

              {userDisciplinesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">
                    Cargando disciplinas...
                  </span>
                </div>
              ) : userDisciplines.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">
                    No tenés disciplinas asignadas todavía.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userDisciplines.map((ud) => {
                    const levels = levelsByDiscipline[ud.disciplineId] || [];
                    const selectValue = pendingLevels[ud.disciplineId]?.toString() || "";
                    return (
                      <div
                        key={ud.id}
                        className="p-3 rounded-none bg-surface-container-high border border-outline/10 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                ud.discipline?.color || "#3B82F6",
                            }}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {ud.discipline?.name || "Disciplina"}
                          </span>
                        </div>

                        <Select
                          value={selectValue}
                          onValueChange={(value) =>
                            setPendingLevels((prev) => ({
                              ...prev,
                              [ud.disciplineId]: parseInt(value, 10),
                            }))
                          }
                          disabled={isSavingAll || levels.length === 0}
                        >
                          <SelectTrigger className="w-full bg-surface-container border-outline/20 text-primary font-semibold uppercase text-xs tracking-wider h-10 rounded-none">
                            <SelectValue placeholder="Seleccionar nivel" />
                          </SelectTrigger>
                          <SelectContent>
                            {levels.map((level) => (
                              <SelectItem
                                key={level.id}
                                value={level.id.toString()}
                              >
                                {level.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}

                  <Button
                    onClick={handleSaveAll}
                    disabled={isSavingAll}
                    className="w-full"
                  >
                    {isSavingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
      <DialogContent className="w-full max-w-full sm:max-w-md h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
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

            <div className="border-t pt-4 space-y-2">
              <h4 className="text-sm font-medium">Cambiar contraseña</h4>
              <div className="grid gap-2">
                <Label htmlFor="current_password">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Contraseña actual"
                    className="pr-12"
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, current_password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new_password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Nueva contraseña (mínimo 6 caracteres)"
                    className="pr-12"
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new_password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm_password">Confirmar nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repetí la nueva contraseña"
                    className="pr-12"
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirm_password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
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
    </RequireActiveSubscription>
  );
}
