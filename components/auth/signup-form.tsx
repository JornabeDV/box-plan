"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { CoachSelector } from "@/components/auth/coach-selector";
import { Loader2, Eye, EyeOff } from "lucide-react";

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

  const { signIn } = useAuth();

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
        const errorMessage =
          data?.error || `Error ${response.status}: ${response.statusText}`;
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!data.userId) {
        console.error("Response missing userId:", data);
        setError(
          "Error: No se recibió el ID de usuario. Por favor, intenta nuevamente.",
        );
        setLoading(false);
        return;
      }

      setUserId(data.userId);
      setStep("select-coach");
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
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

      const signInResult = await signIn(formData.email, formData.password);

      if (signInResult.error) {
        setError(
          "Error al iniciar sesión. Por favor, inicia sesión manualmente.",
        );
        setSelectingCoach(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await fetch("/api/coaches/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ coachId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al seleccionar el coach");
        setSelectingCoach(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("hasAccount", "true");
        localStorage.setItem("hasVisitedLogin", "true");
      }

      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Error al seleccionar el coach");
      setSelectingCoach(false);
    }
  };

  if (step === "select-coach" && userId) {
    return (
      <div className="w-full">
        <CoachSelector userId={userId} onSelect={handleSelectCoach} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="fullName" className="label-md">
            Nombre Completo
          </label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Tu nombre completo"
            value={formData.fullName}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="label-md">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="label-md">
            Celular (Opcional)
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+54 9 11 1234-5678"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="label-md">
            Contraseña
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="label-md">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirma tu contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full uppercase tracking-[0.15em] text-base"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Cuenta
        </Button>
      </form>

      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
        </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm font-semibold text-primary hover:text-primary-dim transition-colors"
        >
          Inicia sesión aquí
        </button>
      </div>
    </div>
  );
}
