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
        
        if (result.error.includes('Invalid')) {
          errorMessage = 'Email o contraseña incorrectos'
        } else if (result.error.includes('Too many')) {
          errorMessage = 'Demasiados intentos. Intenta más tarde'
        }
        
        return { 
          data: null, 
          error: { message: errorMessage } 
        }
      }
      
      return { data: result, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: { message: 'Error inesperado. Intenta nuevamente.' } 
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
    // TODO: Implementar reset de contraseña
    return { 
      data: null, 
      error: { message: 'Reset de contraseña temporalmente no disponible' } 
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