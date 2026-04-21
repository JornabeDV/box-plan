'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setCheckingToken(false)
        setIsValidToken(false)
        setMessage({ type: 'error', text: 'Token de restablecimiento no encontrado' })
        return
      }

      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`)
        const data = await response.json()

        if (response.ok && data.valid) {
          setIsValidToken(true)
        } else {
          setIsValidToken(false)
          setMessage({ type: 'error', text: data.error || 'Token inválido o expirado' })
        }
      } catch (error) {
        setIsValidToken(false)
        setMessage({ type: 'error', text: 'Error al validar el token' })
      } finally {
        setCheckingToken(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

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

    if (!token) {
      setMessage({ type: 'error', text: 'Token no válido' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al restablecer la contraseña' })
        setLoading(false)
        return
      }

      setMessage({
        type: 'success',
        text: '¡Contraseña actualizada correctamente! Redirigiendo al login...',
      })

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Error inesperado. Intenta nuevamente.' })
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  if (checkingToken) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Verificando token...</span>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
            Token Inválido
          </h3>
          <p className="text-sm text-muted-foreground">
            El enlace de restablecimiento no es válido o ha expirado
          </p>
        </div>

        {message && (
          <Alert variant="destructive">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleBackToLogin} className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al login
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {message && (
          <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10' : 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10'}>
            <AlertDescription className={message.type === 'error' ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className="label-md">
            Nueva Contraseña
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="label-md">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full uppercase tracking-[0.15em] text-base"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Actualizar Contraseña
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={handleBackToLogin}
          className="text-sm font-semibold text-primary hover:text-primary-dim transition-colors"
        >
          Volver al login
        </button>
      </div>
    </div>
  )
}
