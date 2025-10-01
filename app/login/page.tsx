"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { SignUpForm } from "@/components/auth/signup-form"
import { ConnectionTest } from "@/components/debug/connection-test"
import { AdminLogin } from "@/components/debug/admin-login"
import { PlanificationTest } from "@/components/debug/planification-test"
import { useAuth } from "@/hooks/use-auth"
import { Target, Loader2 } from "lucide-react"

/**
 * Página de Login/Registro
 * Maneja la autenticación de usuarios con Supabase
 */
export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/')
    }
    setLoading(false)
  }, [user, authLoading, router])

  const handleSuccess = () => {
    router.push('/')
  }

  const switchToSignUp = () => setMode('signup')
  const switchToLogin = () => setMode('login')

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-card via-card/95 to-primary/10 border-b border-primary/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
        <div className="relative flex items-center justify-center p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Target className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                CrossFit Pro
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === 'login' ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
        <div className="w-full max-w-md space-y-6">
          {mode === 'login' ? (
            <LoginForm 
              onSuccess={handleSuccess}
              onSwitchToSignUp={switchToSignUp}
            />
          ) : (
            <SignUpForm 
              onSuccess={handleSuccess}
              onSwitchToLogin={switchToLogin}
            />
          )}
          
          {/* Admin Login */}
          <AdminLogin />
          
          {/* Planification Test */}
          <PlanificationTest />
          
          {/* Debug component - remove in production */}
          <ConnectionTest />
        </div>
      </main>
    </div>
  )
}