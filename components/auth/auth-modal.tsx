"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoginForm } from './login-form'
import { SignUpForm } from './signup-form'
import { ForgotPasswordForm } from './forgot-password-form'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'login' | 'signup'
  onSuccess?: () => void
}

export function AuthModal({ open, onOpenChange, defaultMode = 'login', onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(defaultMode)

  const handleSuccess = () => {
    onOpenChange(false)
    setMode('login') // Reset to login for next time
    onSuccess?.() // Call the success callback
  }

  const switchToSignUp = () => setMode('signup')
  const switchToLogin = () => setMode('login')
  const switchToForgotPassword = () => setMode('forgot-password')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {mode === 'login' ? 'Iniciar Sesión' : mode === 'signup' ? 'Crear Cuenta' : 'Recuperar Contraseña'}
          </DialogTitle>
        </DialogHeader>
        
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
      </DialogContent>
    </Dialog>
  )
}