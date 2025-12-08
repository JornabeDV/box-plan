'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'

export interface UserRole {
  id: string
  user_id: string
  role: 'admin' | 'user' | 'coach' | 'student'
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

export interface CoachProfile {
  id: number
  userId: number
  businessName: string | null
  phone: string | null
  address: string | null
  maxStudents: number
  currentStudentCount: number
  commissionRate: number
  totalEarnings: number
  createdAt: string
  updatedAt: string
}

export function useAuthWithRoles() {
  const { data: session, status } = useSession()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleOverride, setRoleOverride] = useState<'admin' | 'user' | 'coach' | 'student' | null>(null)
  
  // Ref para evitar llamadas duplicadas
  const loadingRef = useRef(false)
  const lastUserIdRef = useRef<string | number | undefined>(undefined)

  const loadUserRole = async (userId: string | number) => {
    // Evitar llamadas duplicadas
    if (loadingRef.current) {
      return
    }

    // Si el userId no cambió, no hacer la llamada
    if (lastUserIdRef.current === userId) {
      return
    }

    try {
      loadingRef.current = true
      lastUserIdRef.current = userId
      setLoading(true)
      
      // Llamar a API route en el servidor con cache deshabilitado para evitar datos stale
      const response = await fetch('/api/user-role', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch user role')
      }
      
      const data = await response.json()
      
      if (data.role) {
        setUserRole(data.role)
        
        if (data.role.role === 'admin' && data.adminProfile) {
          setAdminProfile(data.adminProfile)
        } else {
          setAdminProfile(null)
        }

        if (data.role.role === 'coach' && data.coachProfile) {
          setCoachProfile(data.coachProfile)
        } else {
          setCoachProfile(null)
        }
      } else {
        setUserRole(null)
        setAdminProfile(null)
        setCoachProfile(null)
      }
      
      setLoading(false)
      loadingRef.current = false
      
    } catch (error) {
      console.error('loadUserRole: Error loading user role:', error)
      setUserRole(null)
      setAdminProfile(null)
      setCoachProfile(null)
      setLoading(false)
      loadingRef.current = false
      lastUserIdRef.current = undefined
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }
    
    const userId = session?.user?.id
    
    // Si no hay sesión, limpiar todo el estado
    if (!session || !userId) {
      setUserRole(null)
      setAdminProfile(null)
      setCoachProfile(null)
      setRoleOverride(null)
      setLoading(false)
      loadingRef.current = false
      lastUserIdRef.current = undefined
      return
    }
    
    // Si el userId cambió, resetear el ref para forzar la carga del nuevo usuario
    if (lastUserIdRef.current !== undefined && lastUserIdRef.current !== userId) {
      lastUserIdRef.current = undefined
      loadingRef.current = false
    }
    
    // Cargar el rol del usuario (la función loadUserRole maneja las verificaciones)
    loadUserRole(userId)
    // Solo dependemos del userId, no del objeto session completo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, status])

  const signOut = async () => {
    // Limpiar todo el estado local antes de hacer logout
    setUserRole(null)
    setAdminProfile(null)
    setCoachProfile(null)
    setRoleOverride(null)
    setLoading(true)
    loadingRef.current = false
    lastUserIdRef.current = undefined
    
    // Hacer logout de NextAuth
    await nextAuthSignOut({ redirect: false })
    
    // Forzar un refresh de la página para limpiar cualquier cache
    window.location.href = '/login'
  }

  const isAdmin = roleOverride ? roleOverride === 'admin' : userRole?.role === 'admin'
  const isUser = roleOverride ? roleOverride === 'user' : userRole?.role === 'user'
  const isCoach = roleOverride ? roleOverride === 'coach' : userRole?.role === 'coach'
  const isStudent = roleOverride ? roleOverride === 'student' : userRole?.role === 'student'

  // Construir objeto user compatible con el tipo esperado
  const user = session?.user ? session.user as any : null

  return {
    user,
    userRole,
    adminProfile,
    coachProfile,
    loading: status === 'loading' || loading,
    sessionStatus: status,
    isAdmin,
    isUser,
    isCoach,
    isStudent,
    signOut
  }
}