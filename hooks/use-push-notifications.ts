'use client'

import { useState, useEffect, useCallback } from 'react'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [swReady, setSwReady] = useState(false)

  // Verificar soporte y estado inicial
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission as PermissionState)

    // Registrar service worker y verificar si ya está suscripto
    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        setSwReady(true)
        const sub = await reg.pushManager.getSubscription()
        setIsSubscribed(!!sub)
      })
      .catch(console.error)
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!swReady || permission === 'unsupported') return false

    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready

      // Pedir permiso si no fue concedido
      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission()
        setPermission(result as PermissionState)
        if (result !== 'granted') return false
      }

      // Suscribirse al push manager
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as unknown as BufferSource,
      })

      // Guardar en el servidor
      const keys = sub.toJSON().keys as { p256dh: string; auth: string }
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys }),
      })

      if (!res.ok) throw new Error('Error al guardar suscripción')

      setIsSubscribed(true)
      setPermission('granted')
      return true
    } catch (err) {
      console.error('Error subscribing to push:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [swReady, permission])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return true

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })

      await sub.unsubscribe()
      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error('Error unsubscribing:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { permission, isSubscribed, loading, subscribe, unsubscribe }
}

// Convierte la VAPID public key de base64url a Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
