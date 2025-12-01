/**
 * Service Worker for caching images and assets
 * Implements a stale-while-revalidate strategy for images
 */

const CACHE_NAME = 'audiogretel-v1';
const IMAGE_CACHE_NAME = 'audiogretel-images-v1';
const STATIC_CACHE_NAME = 'audiogretel-static-v1';

// Resources to precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/favicon.ico',
  '/logo192.png'
];

// Install event - precache static resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Precaching static resources');
        return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('audiogretel-') && 
                     cacheName !== CACHE_NAME &&
                     cacheName !== IMAGE_CACHE_NAME &&
                     cacheName !== STATIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Firebase Storage images - stale-while-revalidate
  if (url.hostname.includes('firebasestorage.googleapis.com')) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            // Cache the new response
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((error) => {
            console.error('[ServiceWorker] Fetch failed for image:', error);
            return cachedResponse; // Return cached version if fetch fails
          });
          
          // Return cached response immediately, but update cache in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Static assets (CSS, JS, images) - cache first, then network
  if (
    url.pathname.startsWith('/static/') ||
    url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|webp)$/)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Update cache in background
            fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
            });
            return cachedResponse;
          }
          
          // Not in cache, fetch from network
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // API calls and other requests - network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Optionally cache API responses
          return networkResponse;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request);
        })
    );
    return;
  }
  
  // Default: network first, then cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Return cached response if network fails
        return caches.match(request);
      })
  );
});

// Message event - handle commands from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('audiogretel-')) {
              console.log('[ServiceWorker] Clearing cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
});

