"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles"
import { Loader2, Target, LogIn, Play, Heart, Share2, Download, Calendar, Star, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CrossFitApp() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const { user, userRole, adminProfile, loading: authLoading, isAdmin, isUser, signOut } = useAuthWithRoles()

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
  }

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
          <span>Cargando...</span>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado, mostrar pantalla de bienvenida
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        
        <main className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
          <div className="text-center space-y-8 max-w-md">
            <div className="relative mx-auto w-24 h-24">
              <div className="w-24 h-24 bg-black border-2 border-border rounded-full flex items-center justify-center">
                <Hash className="w-12 h-12 text-lime-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-lime-400 rounded-full animate-neon-pulse"></div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground">
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
                className="w-full neon-button"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Iniciar Sesión
              </Button>
              
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="text-lime-400 hover:underline font-medium"
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="p-6 space-y-8 pb-32">
        {/* Hero Section - Similar to reference images */}
        <section className="relative">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Background Image Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-50"></div>
            
            {/* Content */}
            <div className="relative p-8 text-center">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wide">
                  Welcome Workout
                </h1>
                <p className="text-lg text-gray-300">Dumbbells</p>
              </div>
              
              {/* Action Icons Row */}
              <div className="flex justify-center gap-8 mt-8">
                <div className="flex flex-col items-center gap-2">
                  <Heart className="w-6 h-6 text-foreground" />
                  <span className="text-xs text-muted-foreground">save</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="w-6 h-6 text-foreground" />
                  <span className="text-xs text-muted-foreground">schedule</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Share2 className="w-6 h-6 text-foreground" />
                  <span className="text-xs text-muted-foreground">share</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Download className="w-6 h-6 text-foreground" />
                  <span className="text-xs text-muted-foreground">download</span>
                </div>
              </div>
              
              {/* Main CTA Button */}
              <div className="mt-8">
                <Button size="lg" className="neon-button w-full max-w-xs">
                  <Play className="w-5 h-5 mr-2" />
                  Start Workout
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Today's Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Hoy, {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </h2>
              <p className="text-muted-foreground">¡Vamos por otro gran entrenamiento!</p>
            </div>
          </div>

          {/* Workout Card */}
          <Card className="dark-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Wednesday</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-lg font-bold text-foreground uppercase">Arms & Deep Core</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">35 mins • Upper Body Strength</p>
                </div>
                <div className="flex items-center gap-4">
                  <Heart className="w-5 h-5 text-foreground" />
                  <Share2 className="w-5 h-5 text-foreground" />
                  <div className="relative">
                    <div className="w-5 h-5 bg-gray-600 rounded"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-lime-400 rounded-full text-xs flex items-center justify-center text-black font-bold">
                      834
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </section>

        {/* Teammates Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-foreground uppercase">Teammates Working Out</h3>
            <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
          </div>
          <p className="text-muted-foreground text-sm mb-4">Double tap or hold avatar to send cheers!</p>
          
          {/* Teammates placeholder */}
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-12 h-12 bg-gray-800 rounded-full border-2 border-gray-700"></div>
            ))}
          </div>
        </section>

        {/* Progress Section */}
        <section>
          <Card className="dark-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-foreground font-bold">Warmup</h4>
                  <div className="w-32 h-1 bg-gray-700 rounded-full mt-2">
                    <div className="w-8 h-1 bg-lime-400 rounded-full"></div>
                  </div>
                </div>
                <div className="text-lime-400 font-bold">2 min</div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}