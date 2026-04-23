'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [emailSent, setEmailSent] = useState(false)
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
          text: 'Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.',
        })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Error inesperado. Intenta nuevamente.',
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
          text: 'Email reenviado correctamente',
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
      <div className="w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold">¡Email enviado!</h3>
          <p className="text-sm text-muted-foreground">
            Te hemos enviado un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Revisa tu bandeja de entrada y sigue las instrucciones del email.</p>
          <p>Si no ves el email, revisa tu carpeta de spam.</p>
        </div>

        {message && (
          <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10' : 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10'}>
            <AlertDescription className={message.type === 'error' ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}>
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
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="label-md">
            Email
          </label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="pr-10"
            />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {message && (
          <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10' : 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10'}>
            <AlertDescription className={message.type === 'error' ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full uppercase tracking-[0.15em] text-base"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar enlace de recuperación
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-primary hover:text-primary-dim transition-colors"
        >
          Volver al login
        </button>
      </div>
    </div>
  )
}
