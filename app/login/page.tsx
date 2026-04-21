"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoginForm } from "@/components/auth/login-form";
import { SignUpForm } from "@/components/auth/signup-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { Loader2 } from "lucide-react";
import Image from "next/image";

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center px-6 pb-12 max-w-md mx-auto">
        {/* Logo */}
        <div className="relative w-64 h-64 mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <Image
            src="\logo_sin_fondo.png"
            alt="Box Plan"
            fill
            className="object-contain relative z-10 drop-shadow-[0_0_15px_rgba(230, 255, 43,0.3)]"
            priority
          />
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="display-lg uppercase italic text-foreground">
            {mode === "login"
              ? "Iniciar Sesión"
              : mode === "signup"
                ? "Crear Cuenta"
                : "Recuperar Contraseña"}
          </h2>
          <div className="mt-3 mx-auto w-16 h-1 bg-primary rounded-full" />
        </div>

        {/* Form */}
        <div className="w-full">
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
    </>
  );
}
