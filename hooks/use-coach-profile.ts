'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { normalizeUserId } from '@/lib/auth-helpers'

export interface CoachProfile {
	id: number
	businessName: string | null
	phone: string | null
	address: string | null
	logoUrl: string | null
	maxStudents: number
	currentStudentCount: number
	commissionRate: number
	platformCommissionRate: number
	mercadopagoAccountId: string | null
	email: string
	name: string | null
	createdAt: string
	updatedAt: string
}

interface UseCoachProfileReturn {
	profile: CoachProfile | null
	loading: boolean
	error: string | null
	fetchProfile: () => Promise<void>
	updateProfile: (updates: Partial<Pick<CoachProfile, 'businessName' | 'phone' | 'address'>>) => Promise<{ success: boolean; error?: string }>
}

export function useCoachProfile(): UseCoachProfileReturn {
	const { data: session } = useSession()
	const [profile, setProfile] = useState<CoachProfile | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const userId = session?.user?.id ? normalizeUserId(session.user.id) : null

	const fetchProfile = useCallback(async () => {
		if (!userId) {
			setProfile(null)
			setLoading(false)
			return
		}

		setLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/coaches/profile')

			if (!response.ok) {
				if (response.status === 401) {
					setProfile(null)
					return
				}
				const data = await response.json()
				throw new Error(data.error || 'Error al cargar el perfil')
			}

			const data = await response.json()
			setProfile(data.profile)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error al cargar el perfil'
			setError(errorMessage)
			console.error('Error fetching coach profile:', err)
		} finally {
			setLoading(false)
		}
	}, [userId])

	const updateProfile = useCallback(async (
		updates: Partial<Pick<CoachProfile, 'businessName' | 'phone' | 'address'>>
	): Promise<{ success: boolean; error?: string }> => {
		if (!userId) {
			return { success: false, error: 'Usuario no autenticado' }
		}

		setLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/coaches/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Error al actualizar el perfil')
			}

			const data = await response.json()
			setProfile(data.profile)
			return { success: true }
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el perfil'
			setError(errorMessage)
			return { success: false, error: errorMessage }
		} finally {
			setLoading(false)
		}
	}, [userId])

	useEffect(() => {
		if (userId) {
			fetchProfile()
		}
	}, [userId, fetchProfile])

	return {
		profile,
		loading,
		error,
		fetchProfile,
		updateProfile
	}
}
