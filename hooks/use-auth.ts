'use client'

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'
import { useCallback } from 'react'

// Re-export for NextAuth session usage
export { useSession } from 'next-auth/react'

export interface AuthState {
  user: any | null
  session: any | null
  loading: boolean
}

export function useAuth() {
  const { data: session, status } = useSession()

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        let errorMessage = result.error
        
        // Mapear errores comunes de NextAuth a mensajes en español
        if (result.error.includes('CredentialsSignin') || result.error.includes('Invalid')) {
          errorMessage = 'Email o contraseña incorrectos'
        } else if (result.error.includes('Email o contraseña incorrectos')) {
          errorMessage = 'Email o contraseña incorrectos'
        } else if (result.error.includes('Too many') || result.error.includes('rate limit')) {
          errorMessage = 'Demasiados intentos. Por favor espera unos minutos'
        } else if (result.error.includes('Email y contraseña son requeridos')) {
          errorMessage = 'Por favor completa todos los campos'
        } else {
          errorMessage = 'Email o contraseña incorrectos'
        }
        
        return { 
          data: null, 
          error: { message: errorMessage } 
        }
      }
      
      if (!result?.ok) {
        return {
          data: null,
          error: { message: 'Email o contraseña incorrectos' }
        }
      }
      
      return { data: result, error: null }
    } catch (err) {
      console.error('SignIn error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado. Intenta nuevamente.'
      return { 
        data: null, 
        error: { message: errorMessage === 'Email o contraseña incorrectos' ? errorMessage : 'Error inesperado. Intenta nuevamente.' } 
      }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: fullName || email.split('@')[0],
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { 
          data: null, 
          error: { message: data.error || 'Error al crear la cuenta' } 
        }
      }

      // Registro exitoso - no hacer login automático, el usuario debe iniciar sesión manualmente
      return { 
        data: { success: true }, 
        error: null 
      }
    } catch (err) {
      console.error('Signup error:', err)
      return { 
        data: null, 
        error: { message: 'Error inesperado al crear la cuenta' } 
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ redirect: false })
    return { error: null }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.error || 'Error al enviar el email de restablecimiento' }
        }
      }

      return { data: { success: true }, error: null }
    } catch (err) {
      console.error('Reset password error:', err)
      return {
        data: null,
        error: { message: 'Error inesperado al solicitar restablecimiento' }
      }
    }
  }, [])

  return {
    user: session?.user || null,
    session,
    loading: status === 'loading',
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}