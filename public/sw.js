const CACHE_NAME = 'wilson-distribuidora-v1.2.5';

// Assets to cache immediately on install
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png',
  '/logo.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // force the waiting service worker to become the active service worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy for Navigation (HTML): Network First
  // This prevents showing an old cached HTML that points to deleted JS bundles
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Strategy for APIs or external domains: Network Only (don't cache)
  if (url.pathname.startsWith('/api') || !url.origin.includes(location.hostname)) {
    return;
  }

  // Strategy for everything else: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Return cached, but update in background
        fetch(request).then(networkResponse => {
           if (networkResponse && networkResponse.status === 200) {
             caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse));
           }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then(networkResponse => {
        // Cache new successful requests
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
