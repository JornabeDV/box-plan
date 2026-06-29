'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  mercadopago_subscription_id: string | null
  mercadopago_payment_id: string | null
  created_at: string
  updated_at: string
  subscription_plans?: {
    name: string
    price: number
    features: string[]
  }
}

export interface PaymentHistory {
  id: string
  user_id: string
  subscription_id: string | null
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  mercadopago_payment_id: string | null
  mercadopago_preference_id: string | null
  payment_method: string | null
  created_at: string
  updated_at: string
}

const PROFILE_KEY = 'profile'
const PROFILE_SUBSCRIPTION_KEY = 'profile-subscription'
const PAYMENT_HISTORY_KEY = 'payment-history'

function createBasicProfile(session: any): Profile {
  return {
    id: String(session?.user?.id || ''),
    email: session?.user?.email || '',
    full_name: session?.user?.name || null,
    avatar_url: session?.user?.image || null,
    phone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

async function fetchProfile(session: any): Promise<Profile> {
  const response = await fetch('/api/profile')

  if (response.status === 401) {
    return createBasicProfile(session)
  }

  if (!response.ok) {
    return createBasicProfile(session)
  }

  const data = await response.json()

  if (!data) {
    return createBasicProfile(session)
  }

  return data
}

async function fetchProfileSubscription(): Promise<Subscription | null> {
  const response = await fetch('/api/subscription')

  if (!response.ok) {
    return null
  }

  return response.json()
}

async function fetchPaymentHistory(): Promise<PaymentHistory[]> {
  const response = await fetch('/api/payment-history')

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return data?.paymentHistory || []
}

interface ProfileState {
  profile: Profile | null
  subscription: Subscription | null
  paymentHistory: PaymentHistory[]
  loading: boolean
  error: string | null
}

export function useProfile() {
  const { data: session, status: sessionStatus } = useSession()
  const queryClient = useQueryClient()
  const userId = session?.user?.id

  const profileQuery = useQuery({
    queryKey: [PROFILE_KEY, userId],
    queryFn: () => fetchProfile(session),
    enabled: sessionStatus !== 'loading' && !!userId,
    staleTime: 1000 * 60 * 5,
  })

  const subscriptionQuery = useQuery({
    queryKey: [PROFILE_SUBSCRIPTION_KEY, userId],
    queryFn: fetchProfileSubscription,
    enabled: sessionStatus !== 'loading' && !!userId,
    staleTime: 1000 * 60 * 5,
  })

  const paymentHistoryQuery = useQuery({
    queryKey: [PAYMENT_HISTORY_KEY, userId],
    queryFn: fetchPaymentHistory,
    enabled: sessionStatus !== 'loading' && !!userId,
    staleTime: 1000 * 60 * 5,
  })

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile> & { current_password?: string; new_password?: string }) => {
      if (!userId) {
        throw new Error('Usuario no autenticado')
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el perfil')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY, userId] })
    },
  })

  const loading = profileQuery.isLoading || subscriptionQuery.isLoading || paymentHistoryQuery.isLoading
  const error = profileQuery.error || subscriptionQuery.error || paymentHistoryQuery.error

  return {
    profile: profileQuery.data ?? null,
    subscription: subscriptionQuery.data ?? null,
    paymentHistory: paymentHistoryQuery.data ?? [],
    loading,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar el perfil') : null,
    loadProfile: async () => { await profileQuery.refetch() },
    loadSubscription: async () => { await subscriptionQuery.refetch() },
    loadPaymentHistory: async () => { await paymentHistoryQuery.refetch() },
    loadAllData: async () => {
      await Promise.all([
        profileQuery.refetch(),
        subscriptionQuery.refetch(),
        paymentHistoryQuery.refetch(),
      ])
    },
    updateProfile: async (updates: Partial<Profile> & { current_password?: string; new_password?: string }) => {
      return updateProfile.mutateAsync(updates)
        .then(data => ({ data, error: null }))
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el perfil'
          return { data: null, error: errorMessage }
        })
    },
  }
}
