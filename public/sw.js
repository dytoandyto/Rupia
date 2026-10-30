const CACHE_NAME = 'rupia-pwa-v4';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
];

// Install: precache essential static shell and offline fallback page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => console.warn('[SW] Precache skipped for:', asset, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean up obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first with offline fallback, strictly excluding sensitive financial APIs
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 1. SECURITY RULE: NEVER cache private financial API responses or sensitive endpoints
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. Next.js internal build assets / HMR: pass through to network
  if (url.pathname.startsWith('/_next/')) {
    return;
  }

  // 3. HTML navigation requests: network first, fallback to /offline.html when offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html').then((offlineResponse) => {
          return offlineResponse || new Response('Offline - Silakan periksa koneksi internet Anda.', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        });
      })
    );
    return;
  }

  // 4. Static assets (icons, manifest): cache with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json')
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Rupia', body: 'Waktunya Check-In Keuangan Harianmu!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.actionUrl || '/beranda' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/beranda';
  event.waitUntil(clients.openWindow(url));
});
