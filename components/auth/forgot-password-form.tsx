'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Mail, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface ForgotPasswordFormProps {
  onBack: () => void
}

/**
 * Formulario de recuperación de contraseña
 * Permite a los usuarios solicitar un enlace para restablecer su contraseña
 */
export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setMessage({ type: 'error', text: 'Por favor ingresa tu email' })
      return
    }

    if (!email.includes('@')) {
      setMessage({ type: 'error', text: 'Por favor ingresa un email válido' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        let errorMessage = error.message
        
        if (error.message.includes('Invalid email')) {
          errorMessage = 'Email no válido'
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No existe una cuenta con este email'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Demasiados intentos. Intenta más tarde'
        }
        
        setMessage({ type: 'error', text: errorMessage })
      } else {
        setEmailSent(true)
        setMessage({ 
          type: 'success', 
          text: 'Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.' 
        })
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: 'Error inesperado. Intenta nuevamente.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setMessage({ type: 'error', text: 'Error al reenviar el email' })
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Email reenviado correctamente' 
        })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al reenviar el email' })
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            ¡Email enviado!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Te hemos enviado un enlace para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            <p>Revisa tu bandeja de entrada y sigue las instrucciones del email.</p>
            <p className="mt-2">Si no ves el email, revisa tu carpeta de spam.</p>
          </div>

          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? 'Reenviando...' : 'Reenviar email'}
            </Button>
            
            <Button
              onClick={onBack}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al login
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          ¿Olvidaste tu contraseña?
        </CardTitle>
        <CardDescription>
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type={showEmail ? 'text' : 'email'}
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowEmail(!showEmail)}
                disabled={loading}
              >
                {showEmail ? (
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

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Button>
            
            <Button
              type="button"
              onClick={onBack}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
