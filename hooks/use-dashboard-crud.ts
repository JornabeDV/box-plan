'use client'

import { useCallback } from 'react'

/**
 * Tipo para resultados de operaciones CRUD
 */
type CRUDResult = { error?: string | null | any } | { error: null | string | undefined; data?: any }

/**
 * Hook para manejar operaciones CRUD con refresh automático del dashboard
 */
export function useDashboardCRUD(refreshDashboard: () => void) {
	const handleCRUDOperation = useCallback(
		async <T extends CRUDResult>(
			operation: () => Promise<T>,
			onSuccess?: () => void
		): Promise<T> => {
			const result = await operation()
			
			// Verificar si hay error (puede ser string, null, undefined, o cualquier falsy)
			if (!result.error) {
				refreshDashboard()
				onSuccess?.()
			}
			
			return result
		},
		[refreshDashboard]
	)

	return { handleCRUDOperation }
}