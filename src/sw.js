/**
 * sw.js — Service Worker customizado (modo injectManifest)
 * O Vite PWA injeta self.__WB_MANIFEST automaticamente durante o build.
 */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache de todos os assets gerados pelo Vite
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Runtime cache: imagens do Appwrite Storage (Appwrite Cloud sfo)
registerRoute(
  ({ url }) => /sfo\.cloud\.appwrite\.io\/v1\/storage\/buckets\/.*\/files\/.*\/(view|preview)/.test(url.href),
  new CacheFirst({
    cacheName: 'appwrite-images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ── Push Notifications ─────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { titulo: event.data.text(), conteudo: '' };
  }

  const { titulo = 'Wilson Distribuidora', conteudo = '', categoria = 'anuncio', url = '/' } = payload;

  const categoriaMeta = {
    anuncio:          { emoji: '📢', tag: 'vitrini-anuncio'    },
    comunicado_geral: { emoji: '📋', tag: 'vitrini-comunicado' },
  };
  const meta = categoriaMeta[categoria] ?? categoriaMeta.anuncio;

  const options = {
    body:              conteudo.length > 120 ? conteudo.slice(0, 120) + '…' : conteudo,
    icon:              '/favicon.png',
    badge:             '/favicon.png',
    tag:               meta.tag,
    renotify:          true,
    vibrate:           [250, 100, 250],
    requireInteraction: false,
    data:              { url },
    actions: [
      { action: 'ver',     title: `${meta.emoji} Ver agora` },
      { action: 'fechar',  title: 'Fechar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(titulo, options)
  );
});

// ── Clique na notificação ──────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'fechar') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se o app já está aberto → foca e navega
        for (const c of clientList) {
          if ('focus' in c) {
            c.focus();
            c.postMessage({ type: 'NAVIGATE', url: targetUrl });
            return;
          }
        }
        // Caso contrário, abre nova aba
        return clients.openWindow(targetUrl);
      })
  );
});
