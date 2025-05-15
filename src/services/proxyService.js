/**
 * Service to handle CORS issues with Firebase Storage using an iframe proxy
 */

// Map to store pending requests
const pendingRequests = new Map();
let requestId = 0;
let proxyFrame = null;
let isProxyReady = false;
let initPromise = null;

/**
 * Initialize the proxy iframe
 */
export const initProxy = () => {
  console.log('[PROXY-INIT] Iniciando servicio de proxy...');
  
  if (initPromise) {
    console.log('[PROXY-INIT] Proxy initialization already in progress');
    return initPromise;
  }
  
  if (proxyFrame && isProxyReady) {
    console.log('[PROXY-INIT] Proxy ya inicializado');
    return Promise.resolve();
  }
  
  initPromise = new Promise((resolve, reject) => {
    try {
      // Remove any existing iframe
      if (proxyFrame) {
        try {
          document.body.removeChild(proxyFrame);
          console.log('[PROXY-INIT] Removed existing iframe');
        } catch (removeError) {
          console.warn('[PROXY-INIT] Error removing existing iframe:', removeError);
        }
        proxyFrame = null;
      }
      
      // Create iframe
      console.log('[PROXY-INIT] Creando iframe de proxy...');
      proxyFrame = document.createElement('iframe');
      proxyFrame.style.display = 'none';
      proxyFrame.src = '/proxy.html';
      
      // Add error handler for iframe loading
      proxyFrame.onerror = (error) => {
        console.error('[PROXY-INIT] Error cargando iframe:', error);
        initPromise = null;
        reject(new Error('Failed to load proxy iframe'));
      };
      
      // Add load handler
      proxyFrame.onload = () => {
        console.log('[PROXY-INIT] Iframe cargado, esperando señal de listo...');
      };
      
      // Add to document
      document.body.appendChild(proxyFrame);
      console.log('[PROXY-INIT] Iframe añadido al documento');
      
      // Listen for messages from the iframe
      window.addEventListener('message', handleProxyMessage);
      console.log('[PROXY-INIT] Listener de mensajes configurado');
      
      // Wait for proxy to be ready with timeout
      const timeoutId = setTimeout(() => {
        console.error('[PROXY-INIT] Timeout esperando señal de proxy listo');
        window.removeEventListener('message', checkProxyReady);
        initPromise = null;
        reject(new Error('Proxy initialization timed out'));
      }, 10000); // 10 seconds timeout
      
      const checkProxyReady = (event) => {
        if (event.data && event.data.type === 'proxyReady') {
          console.log('[PROXY-INIT] ✓ Señal de proxy listo recibida');
          clearTimeout(timeoutId);
          isProxyReady = true;
          window.removeEventListener('message', checkProxyReady);
          initPromise = null;
          resolve();
        }
      };
      
      window.addEventListener('message', checkProxyReady);
      console.log('[PROXY-INIT] Esperando señal de proxy listo...');
    } catch (error) {
      console.error('[PROXY-INIT] Error inicializando proxy:', error);
      initPromise = null;
      reject(error);
    }
  });
  
  return initPromise;
};

/**
 * Handle messages from the proxy iframe
 */
const handleProxyMessage = (event) => {
  if (!event.data) {
    console.warn('[PROXY-HANDLER] Mensaje recibido sin datos');
    return;
  }
  
  if (event.data.type === 'fileContent') {
    const { requestId, content, error, success, url } = event.data;
    console.log(`[PROXY-HANDLER] Mensaje recibido para solicitud #${requestId}, éxito: ${success}`);
    
    // Get the pending request
    const pendingRequest = pendingRequests.get(requestId);
    if (pendingRequest) {
      if (success) {
        console.log(`[PROXY-HANDLER] ✓ Contenido recibido correctamente para solicitud #${requestId}`);
        if (url) {
          console.log(`[PROXY-HANDLER] URL exitosa: ${url}`);
        }
        
        if (typeof content === 'string') {
          console.log(`[PROXY-HANDLER] Longitud del contenido: ${content.length} caracteres`);
          if (content.length > 0) {
            console.log(`[PROXY-HANDLER] Vista previa: ${content.substring(0, 100)}...`);
          } else {
            console.warn(`[PROXY-HANDLER] ⚠ Contenido vacío recibido`);
          }
        } else if (content instanceof Blob) {
          console.log(`[PROXY-HANDLER] Blob recibido: ${content.size} bytes, tipo: ${content.type}`);
        }
        
        pendingRequest.resolve(content);
      } else {
        console.error(`[PROXY-HANDLER] ✗ Error recibido para solicitud #${requestId}: ${error || 'Error desconocido'}`);
        pendingRequest.reject(new Error(error || 'Unknown error'));
      }
      
      // Remove the request from the map
      pendingRequests.delete(requestId);
      console.log(`[PROXY-HANDLER] Solicitud #${requestId} completada y eliminada del mapa`);
    } else {
      console.warn(`[PROXY-HANDLER] ⚠ Recibida respuesta para solicitud #${requestId} que no existe en el mapa`);
    }
  } else if (event.data.type === 'proxyReady') {
    console.log('[PROXY-HANDLER] Señal de proxy listo recibida');
    isProxyReady = true;
  } else if (event.data.type === 'proxyError') {
    console.error(`[PROXY-HANDLER] Error general del proxy: ${event.data.error}`);
  } else {
    console.warn(`[PROXY-HANDLER] Mensaje de tipo desconocido recibido: ${event.data.type}`);
  }
};

/**
 * Fetch a file through the proxy
 * @param {string} url - URL of the file to fetch
 * @param {string} contentType - Type of content to fetch ('text' or 'blob')
 * @returns {Promise<string|Blob>} - The file content
 */
export const fetchThroughProxy = async (url, contentType = 'text') => {
  console.log(`[PROXY] Iniciando fetch a través de proxy para: ${url}`);
  console.log(`[PROXY] Tipo de contenido solicitado: ${contentType}`);
  
  // Make sure proxy is initialized
  if (!proxyFrame || !isProxyReady) {
    console.log('[PROXY] Proxy no inicializado, inicializando...');
    try {
      await initProxy();
      console.log('[PROXY] Proxy inicializado correctamente');
    } catch (initError) {
      console.error('[PROXY] Error inicializando proxy:', initError);
      
      // If proxy initialization fails, try direct fetch as fallback
      console.log('[PROXY] Intentando fetch directo como fallback...');
      try {
        const response = await fetch(url, { 
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': contentType === 'blob' ? 'audio/*, */*' : 'text/*, */*',
            'Origin': window.location.origin
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return contentType === 'blob' ? await response.blob() : await response.text();
      } catch (directFetchError) {
        console.error('[PROXY] Error en fetch directo:', directFetchError);
        throw new Error(`Failed to fetch content: ${directFetchError.message}`);
      }
    }
  }
  
  // Create a new request ID
  const currentRequestId = requestId++;
  console.log(`[PROXY] ID de solicitud asignado: ${currentRequestId}`);
  
  // Create a promise that will be resolved when the proxy responds
  const promise = new Promise((resolve, reject) => {
    // Add a timeout to prevent hanging requests
    const timeoutId = setTimeout(() => {
      console.error(`[PROXY] Timeout para solicitud #${currentRequestId}`);
      pendingRequests.delete(currentRequestId);
      reject(new Error(`Proxy request timed out after 30 seconds: ${url}`));
    }, 30000); // 30 seconds timeout
    
    pendingRequests.set(currentRequestId, { 
      resolve: (data) => {
        clearTimeout(timeoutId);
        resolve(data);
      }, 
      reject: (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  });
  
  // Send the request to the proxy
  try {
    console.log(`[PROXY] Enviando solicitud al iframe proxy...`);
    proxyFrame.contentWindow.postMessage({
      type: 'fetchFile',
      url,
      contentType,
      requestId: currentRequestId
    }, '*');
    console.log(`[PROXY] Solicitud enviada, esperando respuesta...`);
  } catch (postError) {
    console.error('[PROXY] Error enviando mensaje al proxy:', postError);
    pendingRequests.delete(currentRequestId);
    throw new Error(`Failed to send request to proxy: ${postError.message}`);
  }
  
  // Return the promise
  try {
    const result = await promise;
    console.log(`[PROXY] ✓ Respuesta recibida para solicitud #${currentRequestId}`);
    if (contentType === 'text') {
      console.log(`[PROXY] Longitud del contenido: ${result.length} caracteres`);
      console.log(`[PROXY] Vista previa: ${result.substring(0, 100)}...`);
    } else {
      console.log(`[PROXY] Blob recibido: ${result.size} bytes, tipo: ${result.type}`);
    }
    return result;
  } catch (error) {
    console.error(`[PROXY] ✗ Error en solicitud #${currentRequestId}:`, error);
    throw error;
  }
};

/**
 * Clean up the proxy
 */
export const cleanupProxy = () => {
  if (proxyFrame) {
    window.removeEventListener('message', handleProxyMessage);
    document.body.removeChild(proxyFrame);
    proxyFrame = null;
    isProxyReady = false;
    initPromise = null;
  }
}; 