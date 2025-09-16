import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useSimpleAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const getInitialSession = async () => {
      try {
        console.log('useSimpleAuth: Getting session')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('useSimpleAuth: Session error:', error)
        } else {
          console.log('useSimpleAuth: Session found:', !!session?.user)
          setUser(session?.user || null)
        }
      } catch (err) {
        console.error('useSimpleAuth: Error:', err)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useSimpleAuth: Auth change:', event, !!session?.user)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => {
      console.log('useSimpleAuth: Cleanup')
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    user,
    loading,
    signOut
  }
}