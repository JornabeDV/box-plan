'use client'

import { useState, useEffect } from 'react'
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

  const loadUserRole = async (userId: string) => {
    try {
      setLoading(true)
      
      // Llamar a API route en el servidor
      const response = await fetch('/api/user-role')
      
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
      
    } catch (error) {
      console.error('loadUserRole: Error loading user role:', error)
      setUserRole(null)
      setAdminProfile(null)
      setCoachProfile(null)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }
    
    const userId = session?.user?.id
    if (userId) {
      // Convertir userId a string si es necesario
      const userIdString = typeof userId === 'string' ? userId : String(userId)
      loadUserRole(userIdString)
    } else {
      setUserRole(null)
      setAdminProfile(null)
      setCoachProfile(null)
      setLoading(false)
    }
  }, [session, status])

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false })
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
    isAdmin,
    isUser,
    isCoach,
    isStudent,
    signOut
  }
}