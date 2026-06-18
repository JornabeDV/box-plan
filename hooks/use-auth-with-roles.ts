'use client'

import { useState, useCallback } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'

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

interface UserRoleData {
  role: UserRole | null
  adminProfile: AdminProfile | null
  coachProfile: CoachProfile | null
}

const USER_ROLE_KEY = 'user-role'

async function fetchUserRole(): Promise<UserRoleData> {
  const response = await fetch('/api/user-role')

  if (!response.ok) {
    throw new Error('Failed to fetch user role')
  }

  const data = await response.json()

  return {
    role: data.role || null,
    adminProfile: data.role?.role === 'admin' && data.adminProfile ? data.adminProfile : null,
    coachProfile: data.role?.role === 'coach' && data.coachProfile ? data.coachProfile : null,
  }
}

export function useAuthWithRoles() {
  const { data: session, status } = useSession()
  const [roleOverride, setRoleOverride] = useState<'admin' | 'user' | 'coach' | 'student' | null>(null)

  const userId = session?.user?.id

  const { data: roleData, isLoading, error } = useQuery({
    queryKey: [USER_ROLE_KEY, userId],
    queryFn: fetchUserRole,
    enabled: status !== 'loading' && !!userId,
    // El rol no cambia frecuentemente durante la sesión
    staleTime: 1000 * 60 * 10,
  })

  const signOut = useCallback(async () => {
    setRoleOverride(null)
    await nextAuthSignOut({ redirect: true, callbackUrl: '/login' })
  }, [])

  const userRole = roleData?.role ?? null
  const adminProfile = roleData?.adminProfile ?? null
  const coachProfile = roleData?.coachProfile ?? null

  const isAdmin = roleOverride ? roleOverride === 'admin' : userRole?.role === 'admin'
  const isUser = roleOverride ? roleOverride === 'user' : userRole?.role === 'user'
  const isCoach = roleOverride ? roleOverride === 'coach' : userRole?.role === 'coach'
  const isStudent = roleOverride ? roleOverride === 'student' : userRole?.role === 'student'

  const user = session?.user ? session.user as any : null

  return {
    user,
    userRole,
    adminProfile,
    coachProfile,
    loading: status === 'loading' || isLoading,
    sessionStatus: status,
    isAdmin,
    isUser,
    isCoach,
    isStudent,
    signOut,
    roleOverride,
    setRoleOverride,
    error: error ? (error instanceof Error ? error.message : 'Error loading user role') : null,
  }
}
