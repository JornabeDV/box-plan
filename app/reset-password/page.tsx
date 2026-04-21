import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Restablecer Contraseña">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Verificando token...
            </div>
          </div>
        </AuthLayout>
      }
    >
      <AuthLayout title="Restablecer Contraseña">
        <ResetPasswordForm />
      </AuthLayout>
    </Suspense>
  );
}
