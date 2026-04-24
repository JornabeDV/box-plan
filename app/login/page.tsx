"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoginForm } from "@/components/auth/login-form";
import { SignUpForm } from "@/components/auth/signup-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot-password">(
    "login",
  );
  const router = useRouter();

  // Marcar que el usuario visitó login para que la landing redirija directamente la próxima vez
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasVisitedLogin", "true");
    }
  }, []);
  const { data: session, status: sessionStatus } = useSession();
  const {
    user,
    userRole,
    isAdmin,
    isCoach,
    loading: authLoading,
  } = useAuthWithRoles();

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      if (!authLoading && user && userRole) {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectParam = searchParams.get("redirect");

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

  const handleSuccess = () => {};

  const switchToSignUp = () => setMode("signup");
  const switchToLogin = () => setMode("login");
  const switchToForgotPassword = () => setMode("forgot-password");

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Cargando...</span>
        </div>
      </div>
    );
  }

  const title =
    mode === "login"
      ? "Iniciar Sesión"
      : mode === "signup"
        ? "Crear Cuenta"
        : "Recuperar Contraseña";

  return (
    <AuthLayout title={title}>
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
    </AuthLayout>
  );
}
