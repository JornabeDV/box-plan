'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseLoadingTimeoutOptions {
  timeout?: number  // Timeout en ms, default 10000 (10s)
  onTimeout?: () => void
}

interface UseLoadingTimeoutReturn {
  hasTimedOut: boolean
  resetTimeout: () => void
  clearTimeout: () => void
}

/**
 * Hook para detectar cuando un loading lleva demasiado tiempo
 * Útil para evitar pantallas de loading infinito en caso de errores
 */
export function useLoadingTimeout(
  isLoading: boolean,
  options: UseLoadingTimeoutOptions = {}
): UseLoadingTimeoutReturn {
  const { timeout = 10000, onTimeout } = options
  const [hasTimedOut, setHasTimedOut] = useState(false)

  const clearTimeoutFn = useCallback(() => {
    setHasTimedOut(false)
  }, [])

  const resetTimeout = useCallback(() => {
    setHasTimedOut(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false)
      return
    }

    // Si está cargando, iniciar el timeout
    const timer = setTimeout(() => {
      setHasTimedOut(true)
      onTimeout?.()
    }, timeout)

    return () => {
      clearTimeout(timer)
    }
  }, [isLoading, timeout, onTimeout])

  return {
    hasTimedOut,
    resetTimeout,
    clearTimeout: clearTimeoutFn
  }
}
