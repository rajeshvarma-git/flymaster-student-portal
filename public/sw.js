const CACHE_NAME = 'flymasters-v1.1.1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/favicon-32.png',
  '/favicon-48.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.log('Service Worker: Error caching files', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  const path = new URL(event.request.url).pathname;
  if (path.startsWith('/__')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return fetchResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from Fly Masters',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Fly Masters', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action !== 'close') {
    event.waitUntil(clients.openWindow('/'));
  }
});
