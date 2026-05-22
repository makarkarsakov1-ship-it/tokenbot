/* ============================================
   AURA WALLET — Service Worker
   Версия кэша: v1.0
   ============================================ */

const CACHE_NAME = 'aura-wallet-v1.0';
const STATIC_CACHE = 'aura-static-v1.0';

// Файлы для кэширования
const ASSETS_TO_CACHE = [
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// === УСТАНОВКА ===
self.addEventListener('install', (event) => {
  console.log('[SW] Установка Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Кэширование статических ресурсов');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Некоторые ресурсы не удалось закэшировать:', err);
      });
    })
  );
  self.skipWaiting();
});

// === АКТИВАЦИЯ ===
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Удаление старого кэша:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// === ПЕРЕХВАТ ЗАПРОСОВ (Cache First strategy) ===
self.addEventListener('fetch', (event) => {
  // Пропускаем не-GET запросы и API
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Возвращаем из кэша и обновляем в фоне
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Если нет в кэше — загружаем из сети
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Оффлайн-фоллбэк
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// === PUSH УВЕДОМЛЕНИЯ (Mock) ===
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Новое уведомление от AURA',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'dismiss', title: 'Закрыть' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'AURA Wallet', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open') {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});

// === BACKGROUND SYNC (Mock для будущей интеграции) ===
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  // TODO: Синхронизация с банковским бэкендом
  console.log('[SW] Background sync транзакций...');
}
