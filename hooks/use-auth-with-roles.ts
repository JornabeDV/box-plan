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
    console.log('useAuthWithRoles: Starting useEffect')
    
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        console.log('useAuthWithRoles: Getting session')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('useAuthWithRoles: Session response:', { session: !!session, error })
        
        if (error) {
          console.error('useAuthWithRoles: Session error:', error)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('useAuthWithRoles: User found:', session.user.email)
          setUser(session.user)
          await loadUserRole(session.user.id)
        } else {
          console.log('useAuthWithRoles: No user found, setting loading to false')
          setUser(null)
          setLoading(false)
        }
      } catch (err) {
        console.error('useAuthWithRoles: Error:', err)
        setLoading(false)
      }
    }

    console.log('useAuthWithRoles: About to call getInitialSession')
    getInitialSession()

    // Escuchar cambios de autenticación
    console.log('useAuthWithRoles: Setting up auth state change listener')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuthWithRoles: Auth change:', event, !!session?.user)
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

    console.log('useAuthWithRoles: useEffect setup complete')

    return () => {
      console.log('useAuthWithRoles: Cleanup')
      subscription.unsubscribe()
    }
  }, [])

  const loadUserRole = async (userId: string) => {
    try {
      console.log('loadUserRole: Starting for user:', userId)
      
      // Cargar rol del usuario
      console.log('loadUserRole: Querying user_roles_simple table...')
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles_simple')
        .select('*')
        .eq('user_id', userId)
        .single()

      console.log('loadUserRole: Role query result:', { roleData, roleError })

      if (roleError) {
        console.error('loadUserRole: Error loading user role:', roleError)
        setUserRole(null)
        setLoading(false)
        return
      }

      setUserRole(roleData)
      console.log('loadUserRole: User role loaded:', roleData)

      // Si es admin, cargar perfil de admin
      if (roleData.role === 'admin') {
        console.log('loadUserRole: User is admin, loading admin profile')
        await loadAdminProfile(userId)
      } else {
        console.log('loadUserRole: User is not admin, setting loading to false')
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