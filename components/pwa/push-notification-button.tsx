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
      variant="outline"
      size="icon"
      onClick={handleToggle}
      disabled={loading}
      className={`h-11 w-11 rounded-none shrink-0 ${
        isSubscribed
          ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
          : 'bg-primary/5 border-primary/50 text-primary hover:bg-primary/10'
      }`}
      aria-label={isSubscribed ? 'Notificaciones activas' : 'Activar notificaciones'}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-5 h-5" />
      ) : (
        <BellOff className="w-5 h-5" />
      )}
    </Button>
  )
}
