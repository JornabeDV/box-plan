"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentDisciplinesManager } from "./student-disciplines-manager";

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  coachId: string | null;
  onUserUpdated?: () => void;
}

export function UserEditModal({
  open,
  onOpenChange,
  user,
  coachId,
  onUserUpdated,
}: UserEditModalProps) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
  });

  // Actualizar formData cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        full_name: user.full_name || "",
        password: "",
        confirmPassword: "",
      });
      setShowPasswordField(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [user]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Preparar body solo con los campos que cambiaron
      const updateBody: {
        email?: string;
        full_name?: string | null;
        password?: string;
      } = {};

      // Solo incluir email si cambió
      if (formData.email !== user.email) {
        updateBody.email = formData.email;
      }

      // Solo incluir full_name si cambió
      if (formData.full_name !== (user.full_name || "")) {
        updateBody.full_name = formData.full_name || null;
      }

      // Incluir password si se completó
      if (formData.password?.trim()) {
        const trimmedPassword = formData.password.trim();
        const trimmedConfirmPassword = formData.confirmPassword.trim();

        if (trimmedPassword.length < 6) {
          toast({
            title: "Error de validación",
            description: "La contraseña debe tener al menos 6 caracteres",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (trimmedPassword !== trimmedConfirmPassword) {
          toast({
            title: "Error de validación",
            description: "Las contraseñas no coinciden",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        updateBody.password = trimmedPassword;
      }

      // Si no hay cambios en el perfil, solo cerrar
      if (Object.keys(updateBody).length === 0) {
        onOpenChange(false);
        return;
      }

      // Actualizar perfil del usuario (solo campos que cambiaron)
      const profileUpdateResponse = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateBody),
      });

      if (!profileUpdateResponse.ok) {
        const errorData = await profileUpdateResponse
          .json()
          .catch(() => ({ error: "Error desconocido" }));
        const errorMessage =
          errorData.error || errorData.details || "Error al actualizar perfil";
        throw new Error(errorMessage);
      }

      // Cerrar el modal
      onOpenChange(false);
      // Actualizar la lista de usuarios
      if (onUserUpdated) {
        onUserUpdated();
      }

      const passwordUpdated = updateBody.password !== undefined;
      toast({
        title: "Usuario actualizado",
        description: passwordUpdated
          ? "Los datos del usuario y la contraseña se han actualizado exitosamente."
          : "Los datos del usuario se han actualizado exitosamente.",
        variant: "default",
      });

      // Limpiar el campo de contraseña
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      setShowPasswordField(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar el usuario";
      toast({
        title: "Error al actualizar usuario",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Usuario
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información básica del usuario */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="email@ejemplo.com"
              className="text-sm placeholder:text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
              placeholder="Nombre del usuario"
              className="text-sm placeholder:text-sm"
            />
          </div>

          {/* Resetear contraseña */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordField(!showPasswordField);
                  if (showPasswordField) {
                    setFormData((prev) => ({
                      ...prev,
                      password: "",
                      confirmPassword: "",
                    }));
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }
                }}
                disabled={loading}
                className="hover:scale-100 active:scale-100"
              >
                {showPasswordField ? "Cancelar" : "Resetear"}
              </Button>
            </div>
            {showPasswordField && (
              <>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    className="pr-10 text-sm placeholder:text-sm truncate"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Nueva contraseña (mínimo 6 caracteres)"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute -right-4 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirmar contraseña"
                    minLength={6}
                    className="pr-10 text-sm placeholder:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute -right-4 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formData.password &&
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-destructive">
                      Las contraseñas no coinciden
                    </p>
                  )}
                {formData.password &&
                  formData.confirmPassword &&
                  formData.password === formData.confirmPassword &&
                  formData.password.length >= 6 && (
                    <p className="text-xs text-green-600">
                      Las contraseñas coinciden
                    </p>
                  )}
                <p className="text-xs text-muted-foreground">
                  La contraseña se actualizará cuando guardes los cambios.
                </p>
              </>
            )}
          </div>
          {/* Nota: La gestión de disciplinas ahora se realiza mediante el componente StudentDisciplinesManager arriba */}
          <div className="text-sm text-muted-foreground">
            <p>
              Usa el panel de &quot;Disciplinas&quot; arriba para asignar múltiples disciplinas al estudiante.
            </p>
          </div>

          {/* Gestión de Disciplinas del Estudiante */}
          <div className="pt-2">
            <StudentDisciplinesManager
              studentId={user?.id || null}
              studentName={user?.full_name || user?.email || 'Estudiante'}
              coachId={coachId}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-4 w-full max-sm:flex-col">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto hover:scale-100 active:scale-100"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto hover:scale-100 active:scale-100"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
