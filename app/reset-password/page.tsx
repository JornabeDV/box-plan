'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, CheckCircle, ArrowLeft, Target, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/**
 * Página de restablecimiento de contraseña
 * Se accede desde el enlace enviado por email
 */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Verificar si hay una sesión válida para reset de contraseña
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error checking session:', error)
          setMessage({ type: 'error', text: 'Sesión inválida o expirada' })
          setCheckingSession(false)
          return
        }

        if (session?.user) {
          setIsValidSession(true)
        } else {
          setMessage({ type: 'error', text: 'Sesión inválida o expirada' })
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setMessage({ type: 'error', text: 'Error al verificar la sesión' })
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validaciones
    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: 'Por favor completa todos los campos' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        let errorMessage = error.message
        
        if (error.message.includes('Password should be at least')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres'
        } else if (error.message.includes('Invalid session')) {
          errorMessage = 'Sesión inválida o expirada'
        }
        
        setMessage({ type: 'error', text: errorMessage })
      } else {
        setMessage({ 
          type: 'success', 
          text: '¡Contraseña actualizada correctamente! Redirigiendo...' 
        })
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error inesperado. Intenta nuevamente.' })
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="relative border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
          <div className="relative flex items-center justify-center p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                  <CheckCircle className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  CrossFit Pro
                </h1>
                <p className="text-sm text-muted-foreground">
                  Verificando sesión...
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Verificando sesión...</span>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="relative border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
          <div className="relative flex items-center justify-center p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  CrossFit Pro
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sesión inválida
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-red-600">
                Sesión Inválida
              </CardTitle>
              <CardDescription>
                El enlace de recuperación no es válido o ha expirado
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {message && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleBackToLogin}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
        <div className="relative flex items-center justify-center p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <CheckCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                CrossFit Pro
              </h1>
              <p className="text-sm text-muted-foreground">
                Restablecer contraseña
              </p>
            </div>
          </div>
        </div>
      </header>

        {/* Main Content */}
        <main className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Restablecer Contraseña
              </CardTitle>
              <CardDescription>
                Ingresa tu nueva contraseña
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {message && (
                  <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                    <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Actualizar Contraseña
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
    </div>
  )
}
