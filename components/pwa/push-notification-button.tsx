'use client'

import { usePushNotifications } from '@/hooks/use-push-notifications'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function PushNotificationButton() {
  const { permission, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications()
  const { toast } = useToast()

  // No renderizar si el browser no lo soporta
  if (permission === 'unsupported') return null

  const handleToggle = async () => {
    if (isSubscribed) {
      const ok = await unsubscribe()
      if (ok) toast({ title: 'Notificaciones desactivadas' })
    } else {
      if (permission === 'denied') {
        toast({
          title: 'Notificaciones bloqueadas',
          description: 'Habilitá las notificaciones desde la configuración del navegador.',
          variant: 'destructive',
        })
        return
      }
      const ok = await subscribe()
      if (ok) {
        toast({ title: 'Notificaciones activadas', description: 'Te avisaremos cuando haya novedades.' })
      } else if (Notification.permission === 'denied') {
        toast({
          title: 'Permiso denegado',
          description: 'Habilitá las notificaciones desde la configuración del navegador.',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <Button
      variant={isSubscribed ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {isSubscribed ? 'Notificaciones activas' : 'Activar notificaciones'}
      </span>
    </Button>
  )
}
