'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { normalizeUserId } from '@/lib/auth-helpers'

export interface CoachInfo {
	id: number
	businessName: string | null
	phone: string | null
	email: string | null
}

interface UseStudentCoachReturn {
	coach: CoachInfo | null
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
}

const STUDENT_COACH_KEY = 'student-coach'

async function fetchStudentCoach(): Promise<CoachInfo | null> {
	const response = await fetch('/api/student/coach')

	if (response.status === 404) {
		return null
	}

	if (!response.ok) {
		throw new Error(`Error ${response.status} al obtener información del coach`)
	}

	const data = await response.json()

	if (!data.data) {
		return null
	}

	return {
		id: data.data.id,
		businessName: data.data.businessName,
		phone: data.data.phone,
		email: data.data.email,
	}
}

export function useStudentCoach(): UseStudentCoachReturn {
	const { data: session, status: sessionStatus } = useSession()
	const userId = normalizeUserId(session?.user?.id)

	const { data: coach, isLoading, error, refetch } = useQuery({
		queryKey: [STUDENT_COACH_KEY, userId],
		queryFn: fetchStudentCoach,
		enabled: sessionStatus !== 'loading' && !!userId,
		staleTime: 1000 * 60 * 5,
	})

	return {
		coach: coach ?? null,
		loading: isLoading,
		error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
		refetch: async () => {
			await refetch()
		},
	}
}
