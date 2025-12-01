/**
 * Service Worker para caché de imágenes optimizado
 * Estrategia: Cache First con fallback a Network
 * Se enfoca especialmente en imágenes de Firebase Storage
 */

const CACHE_NAME = 'audiogretel-images-v1';
const IMAGE_CACHE_TIME = 7 * 24 * 60 * 60 * 1000; // 7 días

// URLs que queremos cachear
const CACHEABLE_ORIGINS = [
  'https://firebasestorage.googleapis.com',
  self.location.origin
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalado');
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado');
  
  // Limpiar cachés antiguas
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Interceptar solicitudes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo cachear imágenes de orígenes específicos
  const isImage = request.destination === 'image' || 
                  request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  
  const isCacheableOrigin = CACHEABLE_ORIGINS.some(origin => 
    request.url.startsWith(origin)
  );
  
  if (!isImage || !isCacheableOrigin) {
    return; // No interceptar esta solicitud
  }
  
  event.respondWith(
    cacheFirstStrategy(request)
  );
});

/**
 * Estrategia Cache First: 
 * 1. Buscar en caché primero
 * 2. Si no está en caché, hacer fetch
 * 3. Guardar en caché para futuras solicitudes
 */
async function cacheFirstStrategy(request) {
  try {
    // Intentar obtener desde caché
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Imagen servida desde caché:', request.url);
      
      // Verificar si la caché está vencida
      const cacheTime = await getCacheTime(request.url);
      const now = Date.now();
      
      if (cacheTime && (now - cacheTime) > IMAGE_CACHE_TIME) {
        console.log('[SW] Caché vencida, actualizando en background:', request.url);
        // Actualizar en background
        fetchAndCache(request);
      }
      
      return cachedResponse;
    }
    
    // Si no está en caché, hacer fetch
    console.log('[SW] Imagen no en caché, descargando:', request.url);
    return await fetchAndCache(request);
    
  } catch (error) {
    console.error('[SW] Error en cacheFirstStrategy:', error);
    
    // Fallback: intentar obtener de la red directamente
    return fetch(request);
  }
}

/**
 * Hacer fetch y guardar en caché
 */
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    
    // Solo cachear respuestas exitosas
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      
      // Clonar la respuesta porque solo se puede usar una vez
      cache.put(request, response.clone());
      
      // Guardar timestamp de caché
      await saveCacheTime(request.url);
      
      console.log('[SW] Imagen guardada en caché:', request.url);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Error en fetchAndCache:', error);
    throw error;
  }
}

/**
 * Guardar timestamp de cuando se cacheó un recurso
 */
async function saveCacheTime(url) {
  try {
    const cache = await caches.open(CACHE_NAME + '-timestamps');
    const timestamp = Date.now().toString();
    const response = new Response(timestamp);
    await cache.put(url, response);
  } catch (error) {
    console.error('[SW] Error guardando timestamp de caché:', error);
  }
}

/**
 * Obtener timestamp de cuando se cacheó un recurso
 */
async function getCacheTime(url) {
  try {
    const cache = await caches.open(CACHE_NAME + '-timestamps');
    const response = await cache.match(url);
    
    if (response) {
      const text = await response.text();
      return parseInt(text, 10);
    }
    
    return null;
  } catch (error) {
    console.error('[SW] Error obteniendo timestamp de caché:', error);
    return null;
  }
}

/**
 * Mensaje para limpiar caché manualmente
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('audiogretel-images')) {
              console.log('[SW] Limpiando caché:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        console.log('[SW] Caché limpiada exitosamente');
        return self.clients.matchAll();
      }).then((clients) => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_CLEARED',
            message: 'Caché de imágenes limpiada'
          });
        });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      })
    );
  }
});

/**
 * Obtener tamaño de la caché
 */
async function getCacheSize() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    let totalSize = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
    
    return {
      count: keys.length,
      bytes: totalSize,
      megabytes: (totalSize / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('[SW] Error obteniendo tamaño de caché:', error);
    return { count: 0, bytes: 0, megabytes: '0' };
  }
}

