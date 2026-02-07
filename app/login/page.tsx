"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoginForm } from "@/components/auth/login-form";
import { SignUpForm } from "@/components/auth/signup-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { Loader2 } from "lucide-react";

/**
 * Página de Login/Registro
 * Maneja la autenticación de usuarios con NextAuth y Neon PostgreSQL
 */
export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot-password">(
    "login",
  );
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const {
    user,
    userRole,
    isAdmin,
    isCoach,
    loading: authLoading,
  } = useAuthWithRoles();

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    // Si la sesión está autenticada (incluso si aún no tenemos el userRole), mostrar loading
    // Esto evita el parpadeo del formulario después del login
    if (sessionStatus === "authenticated" && session?.user) {
      // Si ya tenemos el userRole, redirigir inmediatamente
      if (!authLoading && user && userRole) {
        // Verificar si hay un redirect param en la URL
        const searchParams = new URLSearchParams(window.location.search);
        const redirectParam = searchParams.get("redirect");

        // Redirigir según el rol del usuario
        if (isAdmin) {
          router.replace("/superadmin");
        } else if (isCoach) {
          router.replace("/admin-dashboard");
        } else if (redirectParam) {
          router.replace(redirectParam);
        } else {
          router.replace("/");
        }
      }
      // Si aún no tenemos userRole pero hay sesión, mantener loading
      // El hook useAuthWithRoles se encargará de cargar el rol
    }
  }, [
    sessionStatus,
    session,
    user,
    userRole,
    isAdmin,
    isCoach,
    authLoading,
    router,
  ]);

  const handleSuccess = () => {
    // La redirección se maneja en el useEffect según el rol
    // Este callback se ejecuta después del login exitoso
  };

  const switchToSignUp = () => setMode("signup");
  const switchToLogin = () => setMode("login");
  const switchToForgotPassword = () => setMode("forgot-password");

  // Si es coach y está autenticado, no mostrar loader (el dashboard tiene su propio loader)
  // Solo redirigir inmediatamente
  if (isCoach && sessionStatus === "authenticated" && session?.user) {
    return null;
  }

  if (
    sessionStatus === "loading" ||
    (sessionStatus === "authenticated" && session?.user) ||
    authLoading ||
    (user && userRole)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-background via-background to-card text-foreground">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-card via-card/95 to-primary/10 border-b border-primary/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
        <div className="relative flex items-center justify-center p-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Box Plan
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {mode === "login" ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToSignUp={switchToSignUp}
              onForgotPassword={switchToForgotPassword}
            />
          ) : mode === "signup" ? (
            <SignUpForm
              onSuccess={handleSuccess}
              onSwitchToLogin={switchToLogin}
            />
          ) : (
            <ForgotPasswordForm onBack={switchToLogin} />
          )}
        </div>
      </main>
    </div>
  );
}
