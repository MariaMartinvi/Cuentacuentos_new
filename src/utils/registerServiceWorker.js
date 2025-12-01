/**
 * Utilidad para registrar el Service Worker de caché de imágenes
 */

export const registerImageCacheServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔧 Registrando Service Worker para caché de imágenes...');
      
      const registration = await navigator.serviceWorker.register('/sw-image-cache.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registrado exitosamente:', registration.scope);
      
      // Escuchar actualizaciones del Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Actualizando Service Worker...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✨ Nueva versión del Service Worker disponible');
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      return null;
    }
  } else {
    console.warn('⚠️ Service Worker no soportado en este navegador');
    return null;
  }
};

/**
 * Desregistrar el Service Worker
 */
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🗑️ Service Worker desregistrado');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error desregistrando Service Worker:', error);
      return false;
    }
  }
  
  return false;
};

/**
 * Limpiar caché de imágenes
 */
export const clearImageCache = async () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      console.log('🧹 Limpiando caché de imágenes...');
      
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
      });
      
      // Escuchar confirmación
      return new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('message', function handler(event) {
          if (event.data.type === 'CACHE_CLEARED') {
            console.log('✅ Caché de imágenes limpiada');
            navigator.serviceWorker.removeEventListener('message', handler);
            resolve(true);
          }
        });
        
        // Timeout después de 5 segundos
        setTimeout(() => resolve(false), 5000);
      });
    } catch (error) {
      console.error('❌ Error limpiando caché:', error);
      return false;
    }
  }
  
  return false;
};

/**
 * Obtener tamaño de la caché
 */
export const getCacheSize = async () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.size);
        };
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_SIZE' },
          [messageChannel.port2]
        );
        
        // Timeout después de 5 segundos
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });
    } catch (error) {
      console.error('❌ Error obteniendo tamaño de caché:', error);
      return { count: 0, bytes: 0, megabytes: '0' };
    }
  }
  
  return { count: 0, bytes: 0, megabytes: '0' };
};

/**
 * Verificar si el Service Worker está activo
 */
export const isServiceWorkerActive = () => {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
};

/**
 * Esperar a que el Service Worker esté listo
 */
export const waitForServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker listo');
      return true;
    } catch (error) {
      console.error('❌ Error esperando Service Worker:', error);
      return false;
    }
  }
  
  return false;
};

