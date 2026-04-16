// Box Plan — Service Worker
const CACHE_NAME = 'boxplan-v1'

// Instalación
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activación
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Box Plan', body: event.data.text() }
  }

  const { title, body, icon, url } = data

  event.waitUntil(
    self.registration.showNotification(title || 'Box Plan', {
      body: body || '',
      icon: icon || '/icon-192.jpg',
      badge: '/icon-192.jpg',
      data: { url: url || '/' },
      vibrate: [100, 50, 100],
    })
  )
})

// Click en notificación — abre la URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Si ya hay una ventana abierta, enfocala y navega
        const existing = clients.find((c) => c.url.includes(self.location.origin))
        if (existing) {
          existing.focus()
          return existing.navigate(url)
        }
        // Si no, abre una nueva
        return self.clients.openWindow(url)
      })
  )
})
