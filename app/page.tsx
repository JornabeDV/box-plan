"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { TodaySection } from "@/components/dashboard/today-section"
import { TabsSection } from "@/components/dashboard/tabs-section"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles"
import { Loader2, Target, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CrossFitApp() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const { user, userRole, adminProfile, loading: authLoading, isAdmin, isUser, signOut } = useAuthWithRoles()


  // Datos de ejemplo para el WOD del día
  const todaysWOD = {
    id: "1",
    name: "Fran",
    description: "21-15-9 reps de:",
    type: "metcon" as const,
    difficulty: "intermediate" as const,
    duration_minutes: 8,
    exercises: [
      { name: "Thrusters", weight: "43kg/30kg" },
      { name: "Pull-ups" }
    ]
  }

  const handleStartWOD = () => {
    console.log("Iniciando WOD:", todaysWOD.name)
    // Aquí se implementaría la lógica para iniciar el WOD
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // El usuario será redirigido automáticamente por el hook useAuth
  }

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado, mostrar pantalla de bienvenida
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
        <Header />
        
        <main className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="relative mx-auto w-24 h-24">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/25">
                <Target className="w-12 h-12 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                ¡Bienvenido a CrossFit Pro!
              </h2>
              <p className="text-muted-foreground text-lg">
                Inicia sesión para comenzar tu entrenamiento y seguir tu progreso
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={() => setShowAuthModal(true)} 
                size="lg" 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Iniciar Sesión
              </Button>
              
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </div>
        </main>

        <AuthModal 
          open={showAuthModal} 
          onOpenChange={setShowAuthModal}
          onSuccess={handleAuthSuccess}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      <Header />

                <main className="p-6 space-y-8 pb-24">
                  <TodaySection 
                    todaysWOD={todaysWOD}
                    onStartWOD={handleStartWOD}
                  />
                  
                  <TabsSection />
                </main>

      <BottomNavigation />

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-24"></div>
    </div>
  )
}