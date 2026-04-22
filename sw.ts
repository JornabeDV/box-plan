/// <reference lib="webworker" />

import type { PrecacheEntry } from "serwist";
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Páginas (navegación): network-first con fallback a caché
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages",
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({ maxEntries: 30 }),
        ],
        networkTimeoutSeconds: 5,
      }),
    },
    // Fuentes de Google
    {
      matcher: ({ url }) => url.origin === "https://fonts.gstatic.com",
      handler: new StaleWhileRevalidate({
        cacheName: "google-fonts",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
        ],
      }),
    },
    // Estáticos Next.js (_next/static)
    {
      matcher: ({ url }) => url.pathname.startsWith("/_next/static"),
      handler: new StaleWhileRevalidate({
        cacheName: "next-static",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
    },
    // Imágenes
    {
      matcher: ({ request }) => request.destination === "image",
      handler: new StaleWhileRevalidate({
        cacheName: "images",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }),
        ],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json() as {
    title?: string;
    body?: string;
    icon?: string;
    url?: string;
    tag?: string;
  };

  const title = data.title ?? "Box Plan";
  const options: NotificationOptions & { renotify?: boolean } = {
    body: data.body ?? "",
    icon: data.icon ?? "/icon-192.png",
    badge: "/badge-96x96.png",
    data: { url: data.url ?? "/" },
    tag: data.tag,
    renotify: !!data.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url: string = (event.notification.data?.url as string) ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return (client as WindowClient).focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
