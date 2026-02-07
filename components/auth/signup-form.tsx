"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { CoachSelector } from "@/components/auth/coach-selector";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

type Step = "register" | "select-coach";

export function SignUpForm({ onSuccess, onSwitchToLogin }: SignUpFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [userId, setUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectingCoach, setSelectingCoach] = useState(false);

  const { signUp, signIn } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      // Crear cuenta
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.fullName || formData.email.split("@")[0],
          phone: formData.phone || null,
        }),
      });

      // Verificar si la respuesta es JSON válido
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response:", jsonError);
        setError("Error al procesar la respuesta del servidor");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        // Mostrar el error específico del servidor
        const errorMessage =
          data?.error || `Error ${response.status}: ${response.statusText}`;
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Verificar que userId esté presente
      if (!data.userId) {
        console.error("Response missing userId:", data);
        setError(
          "Error: No se recibió el ID de usuario. Por favor, intenta nuevamente.",
        );
        setLoading(false);
        return;
      }

      // Guardar userId y pasar al siguiente paso
      setUserId(data.userId);
      setStep("select-coach");
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
      // Mostrar mensaje de error más específico
      if (err.message) {
        setError(`Error: ${err.message}`);
      } else if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Error de conexión. Verifica tu conexión a internet e intenta nuevamente.",
        );
      } else {
        setError("Error inesperado. Por favor, intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCoach = async (coachId: number) => {
    if (!userId) return;

    try {
      setSelectingCoach(true);
      setError(null);

      // Primero autenticar al usuario
      const signInResult = await signIn(formData.email, formData.password);

      if (signInResult.error) {
        setError(
          "Error al iniciar sesión. Por favor, inicia sesión manualmente.",
        );
        setSelectingCoach(false);
        return;
      }

      // Esperar un momento para que la sesión se establezca
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Luego asignar el coach
      const response = await fetch("/api/coaches/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Asegurar que se envíen las cookies de sesión
        body: JSON.stringify({ coachId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al seleccionar el coach");
        setSelectingCoach(false);
        return;
      }

      // Éxito - redirigir al dashboard
      if (typeof window !== "undefined") {
        localStorage.setItem("hasAccount", "true");
        localStorage.setItem("hasVisitedLogin", "true");
      }

      // Recargar la página para asegurar que la sesión esté disponible
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Error al seleccionar el coach");
      setSelectingCoach(false);
    }
  };

  // Mostrar selector de coach después del registro
  if (step === "select-coach" && userId) {
    return (
      <div className="w-full">
        <CoachSelector userId={userId} onSelect={handleSelectCoach} />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
        <CardDescription>Únete a la comunidad Box Plan</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Tu nombre completo"
              value={formData.fullName}
              onChange={handleChange}
              className="text-sm placeholder:text-sm"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              className="text-sm placeholder:text-sm"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Celular (Opcional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+54 9 11 1234-5678"
              className="text-sm placeholder:text-sm"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                className="text-sm placeholder:text-sm"
                onChange={handleChange}
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirma tu contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="text-sm placeholder:text-sm"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Cuenta
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Inicia sesión aquí
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
