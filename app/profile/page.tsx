"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { SubscriptionStatus } from "@/components/dashboard/subscription-status"
import { 
  User, 
  Mail, 
  Calendar, 
  LogOut, 
  ArrowLeft
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuth()
  const { profile } = useProfile()

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario después de cargar, mostrar error
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">No autorizado</h2>
          <p className="text-muted-foreground mb-4">No tienes acceso a esta página</p>
          <Button onClick={() => router.push('/')} className="neon-button">
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
        </div>

        {/* Información Básica del Usuario */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-lg bg-secondary text-foreground">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {profile?.full_name || user?.name || 'Usuario'}
                  </h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium text-foreground">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Miembro desde:</span>
                  <span className="text-sm font-medium text-foreground">
                    {profile?.created_at ? formatDistanceToNow(new Date(profile.created_at), { 
                      addSuffix: true, 
                      locale: es 
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado de Suscripción */}
          <div className="mt-6">
            <SubscriptionStatus />
          </div>

          {/* Información de Debug */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-foreground">Información de Debug</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-secondary rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-2">Información de Debug:</h4>
                <pre className="text-xs text-muted-foreground overflow-auto">
                  {JSON.stringify({
                    userId: user?.id,
                    email: user?.email,
                    name: user?.name,
                    role: user?.role,
                    profile: profile ? {
                      id: profile.id,
                      full_name: profile.full_name,
                      avatar_url: profile.avatar_url,
                      created_at: profile.created_at
                    } : null
                  }, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Botón de Cerrar Sesión */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}