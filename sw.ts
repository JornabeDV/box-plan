/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
});

// Use NetworkFirst for navigation requests to avoid "no-response" errors
serwist.setDefaultHandler(new NetworkFirst({
  cacheName: "pages",
  plugins: [
    {
      cacheWillUpdate: async ({ response }) => {
        if (response && response.status === 200) {
          return response;
        }
        return null;
      },
    },
  ],
}));

// Push notifications support (preserved from original sw.js)
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Box Plan", body: event.data.text() };
  }

  const { title, body, icon, url } = data;

  event.waitUntil(
    self.registration.showNotification(title || "Box Plan", {
      body: body || "",
      icon: "/badge-96x96.png",
      data: { url: url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients: readonly WindowClient[]) => {
        const existing = clients.find((c: WindowClient) =>
          c.url.includes(self.location.origin),
        );
        if (existing) {
          existing.focus();
          return existing.navigate(url);
        }
        return self.clients.openWindow(url);
      }),
  );
});

serwist.addEventListeners();
