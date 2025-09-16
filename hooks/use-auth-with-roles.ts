import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UserRole {
  id: string
  user_id: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export interface AdminProfile {
  id: string
  user_id: string
  name: string
  email: string
  organization_name: string | null
  organization_type: string | null
  bio: string | null
  avatar_url: string | null
  contact_phone: string | null
  contact_email: string | null
  website: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useAuthWithRoles() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleOverride, setRoleOverride] = useState<'admin' | 'user' | null>(null)

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('useAuthWithRoles: Session error:', error)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          setUser(session.user)
          await loadUserRole(session.user.id)
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch (err) {
        console.error('useAuthWithRoles: Error:', err)
        setLoading(false)
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        
        if (session?.user) {
          await loadUserRole(session.user.id)
        } else {
          setUserRole(null)
          setAdminProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
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
        setUserRole(null)
        setLoading(false)
        return
      }

      setUserRole(roleData)

      // Si es admin, cargar perfil de admin
      if (roleData.role === 'admin') {
        await loadAdminProfile(userId)
      } else {
        setLoading(false)
      }
      
    } catch (error) {
      console.error('loadUserRole: Error loading user role:', error)
      setLoading(false)
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
        setLoading(false)
        return
      }

      setAdminProfile(data)
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  const isAdmin = roleOverride ? roleOverride === 'admin' : userRole?.role === 'admin'
  const isUser = roleOverride ? roleOverride === 'user' : userRole?.role === 'user'

  return {
    user,
    userRole,
    adminProfile,
    loading,
    isAdmin,
    isUser,
    signOut
  }
}