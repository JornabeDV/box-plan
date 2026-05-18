'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft, Loader2, MessageCircle } from 'lucide-react'

// NOTE: Flujo de recuperación por email desactivado provisionalmente.
// Los endpoints (forgot-password, reset-password, validate-reset-token)
// y el hook useAuth->resetPassword quedan intactos para reactivar en el futuro.

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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
      const response = await fetch('/api/auth/forgot-password-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setMessage({
          type: 'error',
          text: data.error || 'No se encontró información. Verificá tu email o contactá a tu coach directamente.'
        })
        return
      }

      const { coachPhone, studentName, coachName } = await response.json()

      if (!coachPhone) {
        setMessage({
          type: 'error',
          text: 'No se encontró información. Verificá tu email o contactá a tu coach directamente.'
        })
        return
      }

      const text = `Hola ${coachName}, soy ${studentName}. Olvidé mi contraseña de BoxPlan, ¿me la podés resetear?`
      const waUrl = `https://wa.me/${coachPhone}?text=${encodeURIComponent(text)}`

      window.location.href = waUrl
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Error inesperado. Intenta nuevamente.',
      })
    } finally {
      setLoading(false)
    }
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

        <div className="text-sm text-muted-foreground space-y-1">
          <p>Ingresá tu email y te conectaremos con tu coach por WhatsApp para que te resetee la contraseña.</p>
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
          {!loading && <MessageCircle className="mr-2 h-4 w-4" />}
          Contactar a mi coach
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-primary hover:text-primary-dim transition-colors inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al login
        </button>
      </div>
    </div>
  )
}
