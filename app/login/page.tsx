"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { SignUpForm } from "@/components/auth/signup-form"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

/**
 * Página de Login/Registro
 * Maneja la autenticación de usuarios con NextAuth y Neon PostgreSQL
 */
export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login')
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
  const switchToForgotPassword = () => setMode('forgot-password')

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
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Box Plan
            </h1>
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
              onForgotPassword={switchToForgotPassword}
            />
          ) : mode === 'signup' ? (
            <SignUpForm 
              onSuccess={handleSuccess}
              onSwitchToLogin={switchToLogin}
            />
          ) : (
            <ForgotPasswordForm 
              onBack={switchToLogin}
            />
          )}
        </div>
      </main>
    </div>
  )
}