import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AdminProfile {
  id: string
  user_id: string
  name: string
  email: string
  organization_name?: string
  organization_type?: string
  bio?: string
  avatar_url?: string
  contact_phone?: string
  contact_email?: string
  website?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export function useSimplifiedAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si Supabase está configurado
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured - auth disabled')
      setLoading(false)
      return
    }
    
    // Timeout de seguridad para evitar cuelgues
    const timeoutId = setTimeout(() => {
      console.warn('Auth initialization timeout - forcing loading to false')
      setLoading(false)
    }, 10000) // 10 segundos timeout
    
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }
        
        if (session?.user) {
          setUser(session.user)
          await loadUserRole(session.user.id)
        } else {
          console.log('useSimplifiedAuth: No user found')
        }
        setLoading(false)
        clearTimeout(timeoutId)
      } catch (err) {
        console.error('useSimplifiedAuth: Error in getInitialSession:', err)
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            setUser(session.user)
            await loadUserRole(session.user.id)
          } else {
            setUser(null)
            setUserRole(null)
            setAdminProfile(null)
          }
          setLoading(false)
        } catch (err) {
          console.error('useSimplifiedAuth: Error in auth state change:', err)
          setLoading(false)
        }
      }
    )

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const loadUserRole = async (userId: string) => {
    try {
      
      // Cargar rol del usuario
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles_simple')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (roleError) {
        console.error('loadUserRole: Error loading user role:', roleError)
        return
      }

      setUserRole(roleData)

      // Si es admin, cargar perfil de admin
      if (roleData.role === 'admin') {
        await loadAdminProfile(userId)
      }
    } catch (error) {
      console.error('loadUserRole: Error loading user role:', error)
    }
  }

  const createDefaultUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles_simple')
        .insert({
          user_id: userId,
          role: 'user'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating default user role:', error)
        return
      }

      setUserRole(data)
    } catch (error) {
      console.error('Error creating default user role:', error)
    }
  }

  const loadAdminProfile = async (userId: string) => {
    try {
      
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        return
      }

      setAdminProfile(data)
    } catch (error) {
      console.error('Error loading admin profile:', error)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  const isAdmin = userRole?.role === 'admin'
  const isUser = userRole?.role === 'user'

  return {
    user,
    userRole,
    adminProfile,
    loading,
    isAdmin,
    isUser,
    signOut,
    loadAdminProfile
  }
}