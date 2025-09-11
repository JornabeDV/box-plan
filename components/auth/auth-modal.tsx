"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoginForm } from './login-form'
import { SignUpForm } from './signup-form'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'login' | 'signup'
}

export function AuthModal({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode)

  const handleSuccess = () => {
    onOpenChange(false)
    setMode('login') // Reset to login for next time
  }

  const switchToSignUp = () => setMode('signup')
  const switchToLogin = () => setMode('login')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </DialogTitle>
        </DialogHeader>
        
        {mode === 'login' ? (
          <LoginForm 
            onSuccess={handleSuccess}
            onSwitchToSignUp={switchToSignUp}
          />
        ) : (
          <SignUpForm 
            onSuccess={handleSuccess}
            onSwitchToLogin={switchToLogin}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
