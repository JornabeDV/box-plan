'use client'

import { useState, useCallback } from 'react'

/**
 * Hook genérico para manejar el estado de modales
 */
export function useModalState<T = any>() {
	const [isOpen, setIsOpen] = useState(false)
	const [selectedItem, setSelectedItem] = useState<T | null>(null)

	const open = useCallback((item?: T) => {
		if (item !== undefined) {
			setSelectedItem(item)
		}
		setIsOpen(true)
	}, [])

	const close = useCallback(() => {
		setIsOpen(false)
		setSelectedItem(null)
	}, [])

	const handleOpenChange = useCallback((open: boolean) => {
		if (open) {
			setIsOpen(true)
		} else {
			close()
		}
	}, [close])

	return {
		isOpen,
		selectedItem,
		open,
		close,
		handleOpenChange,
		setSelectedItem
	}
}