// Service Worker for InsightLoop MCP Orchestrator
// Version: 1.0.0

const CACHE_NAME = 'insightloop-v1';
const urlsToCache = [
  '/',
  '/discover',
  '/servers',
  '/orchestrate',
  '/offline.html',
  '/_next/static/css/app-layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
];

// API routes that should be cached with network-first strategy
const apiRoutes = [
  '/api/servers/running',
  '/api/info',
  '/health'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching essential files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[ServiceWorker] Pre-caching failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip WebSocket and SSE connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || 
      request.headers.get('accept')?.includes('text/event-stream')) {
    return;
  }

  // API Routes - Network First Strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          
          // Only cache successful responses
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            
            // Return offline API response
            return new Response(
              JSON.stringify({
                error: 'offline',
                message: 'You are currently offline. Some features may be limited.'
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Static Assets - Cache First Strategy
  if (url.pathname.startsWith('/_next/static/') || 
      url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        });
      })
    );
    return;
  }

  // HTML Pages - Network First Strategy
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone();
          
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
        })
    );
    return;
  }

  // Default - Network First Strategy
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orchestration-tasks') {
    event.waitUntil(syncOrchestrationTasks());
  }
});

async function syncOrchestrationTasks() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    const pendingTasks = requests.filter(req => 
      req.url.includes('/api/orchestrate') && req.method === 'POST'
    );
    
    for (const request of pendingTasks) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync task:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return caches.open(CACHE_NAME);
      })
    );
  }
});

// Push notification support
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open InsightLoop',
        icon: '/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('InsightLoop MCP Orchestrator', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});