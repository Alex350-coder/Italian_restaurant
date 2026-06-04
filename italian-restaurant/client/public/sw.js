const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const MENU_CACHE = `menu-${CACHE_VERSION}`;
const OFFLINE_QUEUE = 'offline-queue';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

const MAX_CACHE_SIZE = {
  [STATIC_CACHE]: 50 * 1024 * 1024,
  [API_CACHE]: 20 * 1024 * 1024,
  [IMAGE_CACHE]: 100 * 1024 * 1024,
  [MENU_CACHE]: 10 * 1024 * 1024,
};

const EXPIRATION = {
  [API_CACHE]: 5 * 60 * 1000,
  [MENU_CACHE]: 30 * 60 * 1000,
  [IMAGE_CACHE]: 7 * 24 * 60 * 60 * 1000,
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            const version = key.split('-').pop();
            return (
              key.startsWith('static-') ||
              key.startsWith('api-') ||
              key.startsWith('images-') ||
              key.startsWith('menu-')
            ) && version !== CACHE_VERSION;
          })
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    if (request.method === 'POST' && url.pathname.startsWith('/api/orders')) {
      event.respondWith(handleOfflineOrder(event));
    }
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirstWithFallback(request, API_CACHE));
  } else if (isMenuRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, MENU_CACHE));
  } else {
    event.respondWith(networkFirst(request));
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Restaurant', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  let url = '/';
  if (action === 'view-order' && data.orderId) {
    url = `/order-tracking/${data.orderId}`;
  } else if (action === 'view-menu') {
    url = '/menu';
  } else if (data.url) {
    url = data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existingClient = clients.find((client) => client.url.includes(self.location.origin));
      if (existingClient) {
        existingClient.focus();
        existingClient.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncQueuedOrders());
  }
});

function isStaticAsset(url) {
  return (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.eot') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  );
}

function isImageRequest(url) {
  return (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/i) ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/assets/images/')
  );
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/menu');
}

function isMenuRequest(url) {
  return url.pathname.startsWith('/api/menu');
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithFallback(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function handleOfflineOrder(event) {
  try {
    const response = await fetch(event.request.clone());
    return response;
  } catch {
    const body = await event.request.clone().json();
    const queue = await getOfflineQueue();
    queue.push({
      id: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: event.request.url,
      method: event.request.method,
      body,
      timestamp: Date.now(),
      retries: 0,
    });
    await saveOfflineQueue(queue);

    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'OFFLINE_ORDER_QUEUED',
        payload: { queued: true, orderId: body.orderId },
      });
    });

    return new Response(JSON.stringify({ queued: true, message: 'Order queued for sync' }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function getOfflineQueue() {
  return new Promise((resolve) => {
    const request = indexedDB.open('offline-queue', 1);
    request.onerror = () => resolve([]);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('orders', 'readonly');
      const store = tx.objectStore('orders');
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result || []);
      getAll.onerror = () => resolve([]);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }
    };
  });
}

async function saveOfflineQueue(queue) {
  return new Promise((resolve) => {
    const request = indexedDB.open('offline-queue', 1);
    request.onerror = () => resolve();
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('orders', 'readwrite');
      const store = tx.objectStore('orders');
      store.clear();
      queue.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }
    };
  });
}

async function syncQueuedOrders() {
  const queue = await getOfflineQueue();
  const failed = [];

  for (const item of queue) {
    if (item.retries >= 3) continue;

    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });

      if (!response.ok) {
        item.retries++;
        failed.push(item);
      }
    } catch {
      item.retries++;
      failed.push(item);
    }
  }

  await saveOfflineQueue(failed);

  if (queue.length > failed.length) {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'ORDERS_SYNCED',
        payload: {
          synced: queue.length - failed.length,
          failed: failed.length,
        },
      });
    });
  }
}

async function enforceCacheLimit(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  let totalSize = 0;

  const entries = [];
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const blob = await response.blob();
      const size = blob.size;
      totalSize += size;
      entries.push({ key, size, date: response.headers.get('date') });
    }
  }

  if (totalSize > maxSize) {
    entries.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    let i = 0;
    while (totalSize > maxSize * 0.8 && i < entries.length) {
      await cache.delete(entries[i].key);
      totalSize -= entries[i].size;
      i++;
    }
  }
}

async function cleanupExpiredEntries() {
  for (const [cacheName, maxAge] of Object.entries(EXPIRATION)) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const now = Date.now();

    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const age = now - new Date(dateHeader).getTime();
          if (age > maxAge) {
            await cache.delete(key);
          }
        }
      }
    }
  }
}

setInterval(() => {
  cleanupExpiredEntries();
  for (const [cacheName, maxSize] of Object.entries(MAX_CACHE_SIZE)) {
    enforceCacheLimit(cacheName, maxSize);
  }
}, 60 * 60 * 1000);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then((stats) => {
      event.source.postMessage({ type: 'CACHE_STATS', payload: stats });
    });
  }
});

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    let totalSize = 0;

    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    stats[name] = {
      entries: keys.length,
      size: totalSize,
      sizeFormatted: formatBytes(totalSize),
    };
  }

  return stats;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
