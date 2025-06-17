import i18n from 'i18next'; // Importar i18n para usar traducciones globales
import { getAuthHeader, getCurrentUser, refreshToken } from './authService';
import { auth } from '../firebase/config';
import config from '../config';
import axios from 'axios';

// Rate limiting and throttling variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 10000; // Minimum 10 seconds between requests
let pendingRequest = false;
let rateLimitedUntil = null;

// Use production server URL from config
const API_URL = `${config.apiUrl}/api`;
const backendBaseUrl = config.apiUrl;

console.log('StoryService - Using API URL:', API_URL);
console.log('StoryService - Using backend base URL:', backendBaseUrl);

// Timeout en milisegundos (8 minutos para audios largos)
const FETCH_TIMEOUT = config.isProduction ? 300000 : 120000; // 5 min prod, 2 min dev

// Client-side rate limiting and throttling
const waitForRequestSlot = async () => {
  console.log('Checking request slot availability...');
  
  // If we know the API is rate limited, wait until the specified time
  if (rateLimitedUntil && new Date() < rateLimitedUntil) {
    const waitTime = rateLimitedUntil.getTime() - new Date().getTime();
    console.log(`🕒 API rate limited. Waiting ${Math.ceil(waitTime/1000)} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime + 1000)); // Add a buffer second
  }
  
  // If there's another request in progress, wait until it's done
  if (pendingRequest) {
    console.log('⏳ Another request in progress, waiting...');
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!pendingRequest) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }
  
  // Enforce minimum time between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (lastRequestTime > 0 && timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const timeToWait = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏱️ Throttling: waiting ${timeToWait}ms between requests`);
    await new Promise(resolve => setTimeout(resolve, timeToWait));
  }
  
  // Update request tracking
  pendingRequest = true;
  lastRequestTime = Date.now();
  console.log('Request slot acquired');
};

// Enhanced error diagnostics function
export const diagnoseBackendIssue = async () => {
  console.log('🔍 Running backend diagnostics...');
  
  try {
    // Check server health
    console.log('1️⃣ Checking server health...');
    const healthResponse = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    let healthData;
    try {
      healthData = await healthResponse.json();
      console.log('Health check response:', healthData);
    } catch (e) {
      console.error('Could not parse health check response');
      return { status: 'error', details: 'Could not parse health check response' };
    }
    
    // Check for specific issues
    if (healthData.services?.openai !== 'ok') {
      console.error('❌ OpenAI API issue detected:', healthData.services?.openai);
      
      if (healthData.services?.openai_quota === 'exceeded') {
        return { 
          status: 'critical',
          issue: 'openai_quota_exceeded',
          details: 'OpenAI API quota has been exceeded. This requires administrator attention.'
        };
      }
      
      if (healthData.openai_error) {
        return {
          status: 'error',
          issue: 'openai_api_error',
          details: healthData.openai_error
        };
      }
    }
    
    if (healthData.services?.database !== 'ok') {
      return {
        status: 'error',
        issue: 'database_error',
        details: 'Database connection issue detected'
      };
    }
    
    return {
      status: healthData.status || 'unknown',
      details: healthData
    };
  } catch (error) {
    console.error('Diagnostic check failed:', error);
    
    // Try to get some basic server status info even if the health endpoint failed
    try {
      // If health endpoint failed, try a basic ping to the server root
      const basicPing = await fetch(`${API_URL}`, {
        method: 'HEAD',
        cache: 'no-store',
        timeout: 3000
      });
      
      if (basicPing.ok) {
        return {
          status: 'degraded',
          issue: 'health_endpoint_error',
          details: 'Server is responding but health endpoint failed'
        };
      }
    } catch (pingError) {
      // Server is completely unreachable
      console.error('Server ping failed:', pingError);
    }
    
    return {
      status: 'error',
      issue: 'connection_error',
      details: error.message
    };
  }
};

export const generateStory = async (storyData) => {
  if (pendingRequest) {
    console.log('Request already in progress, queuing...');
    await waitForRequestSlot();
  }
  
  pendingRequest = true;
  console.log('Request started, pendingRequest set to true');

  try {
    const user = await getCurrentUser();
    console.log('Current user for story generation:', user?.email);
    
    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    // Check server health first  
    console.log('Checking server health before story generation...');
    const serverHealth = await checkServerHealth();
    console.log('Server health status:', serverHealth);
    
    // Solo bloquear si hay errores críticos (quota excedida, database down, server_error)
    const criticalErrors = ['critical_service_failure', 'server_error'];
    const shouldBlock = !serverHealth.healthy && criticalErrors.includes(serverHealth.error);
    
    if (shouldBlock) {
      console.error('Server health check failed with critical error:', serverHealth);
      
      return {
        error: 'server_unavailable',
        details: serverHealth,
        userFriendlyMessage: {
          es: serverHealth.details 
            ? `El servidor no está disponible en este momento. Error: ${serverHealth.details}`
            : `The server is currently unavailable. Error: ${serverHealth.details}`
        }
      };
    }
    
    // Para timeouts, errores de red o temporales, continuar pero con warning
    if (!serverHealth.healthy) {
      console.warn('⚠️ Health check issue detected, but proceeding anyway:', {
        status: serverHealth.status,
        error: serverHealth.error,
        details: serverHealth.details
      });
    }

    console.log('🚀 Making story generation request...');
    
    // Get fresh authentication header with improved error handling
    let authHeader;
    try {
      authHeader = await getAuthHeader();
      console.log('✅ Auth header obtained successfully');
    } catch (authError) {
      console.error('❌ Failed to get authentication header:', authError);
      const error = new Error('Authentication failed. Please log in again.');
      error.code = 'AUTH_FAILED';
      throw error;
    }
    
    if (!authHeader.Authorization) {
      console.error('❌ No authorization token available after getting auth header');
      const error = new Error('No authentication token available. Please log in again.');
      error.code = 'AUTH_FAILED';
      throw error;
    }
    
    const response = await axios.post(`${API_URL}/stories/generate`, {
      ...storyData,
      email: user.email
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeader
      },
      timeout: FETCH_TIMEOUT,
      withCredentials: true
    });

    console.log('✅ Story generated successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error in story generation request:', error);
    
    // Handle specific error responses from the backend
    if (error.response?.status === 401) {
      const errorData = error.response.data;
      console.error('❌ Authentication failed (401):', errorData);
      
      // Handle different types of 401 errors based on error codes
      switch (errorData?.code) {
        case 'TOKEN_EXPIRED':
        case 'TOKEN_REVOKED':
          console.log('🔄 Token expired/revoked, attempting to refresh session...');
          break;
        case 'INVALID_TOKEN':
        case 'INVALID_TOKEN_FORMAT':
          console.log('❌ Invalid token format, clearing auth data...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          break;
        case 'NO_AUTH_HEADER':
          console.log('❌ No auth header sent');
          break;
        default:
          console.log('❌ Generic 401 error');
      }
      
      // Try to refresh the user session one time
      try {
        console.log('🔄 Attempting to refresh user session...');
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Force token refresh
          const newToken = await currentUser.getIdToken(true);
          localStorage.setItem('token', newToken);
          console.log('✅ Token refreshed successfully, retrying request...');
          
          // Retry the request once with the new token
          const retryAuthHeader = await getAuthHeader();
          const retryResponse = await axios.post(`${API_URL}/stories/generate`, {
            ...storyData,
            email: currentUser.email
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...retryAuthHeader
            },
            timeout: FETCH_TIMEOUT,
            withCredentials: true
          });
          
          console.log('✅ Story generated successfully on retry');
          return retryResponse.data;
        }
      } catch (refreshError) {
        console.error('❌ Failed to refresh token:', refreshError);
        // Fall through to throw the original error
      }
      
      // If refresh failed, throw authentication error
      const authError = new Error('Authentication failed. Please log in again.');
      authError.code = 'AUTH_FAILED';
      throw authError;
    }
    
    // Handle other HTTP errors
    if (error.response?.status === 403) {
      console.error('❌ Forbidden (403):', error.response.data);
      throw error; // Let the component handle this (usually story limits)
    }
    
    if (error.response?.status === 500) {
      console.error('❌ Server error (500):', error.response.data);
      throw new Error('Server error. Please try again later.');
    }
    
    if (error.response?.status === 503) {
      console.error('❌ Service unavailable (503):', error.response.data);
      throw new Error('Service temporarily unavailable. Please try again later.');
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('❌ Network error');
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('❌ Request timeout');
      throw new Error('Request timed out. The server may be busy. Please try again.');
    }
    
    throw error;
  } finally {
    pendingRequest = false;
    console.log('Request completed, pendingRequest set to false');
  }
};

export const generateStoryWithStreaming = async (storyData, onTextChunk, onProgress, onPhaseComplete) => {
  if (pendingRequest) {
    console.log('Request already in progress, queuing...');
    await waitForRequestSlot();
  }
  
  pendingRequest = true;
  console.log('Request started with streaming, pendingRequest set to true');

  try {
    const user = await getCurrentUser();
    console.log('Current user for story generation:', user?.email);
    
    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    // Check server health first  
    console.log('Checking server health before story generation...');
    const serverHealth = await checkServerHealth();
    console.log('Server health status:', serverHealth);
    
    // Solo bloquear si hay errores críticos (quota excedida, database down, server_error)
    const criticalErrors2 = ['critical_service_failure', 'server_error'];
    const shouldBlock2 = !serverHealth.healthy && criticalErrors2.includes(serverHealth.error);
    
    if (shouldBlock2) {
      console.error('Server health check failed with critical error:', serverHealth);
      
      return {
        error: 'server_unavailable',
        details: serverHealth,
        userFriendlyMessage: {
          es: serverHealth.details 
            ? `El servidor no está disponible en este momento. Error: ${serverHealth.details}`
            : `The server is currently unavailable. Error: ${serverHealth.details}`
        }
      };
    }
    
    // Para timeouts, errores de red o temporales, continuar pero con warning
    if (!serverHealth.healthy) {
      console.warn('⚠️ Health check issue detected, but proceeding anyway:', {
        status: serverHealth.status,
        error: serverHealth.error,
        details: serverHealth.details
      });
    }

    console.log('🚀 Making streaming story generation request...');
    
    // Get fresh authentication header
    let authHeader;
    try {
      authHeader = await getAuthHeader();
      console.log('✅ Auth header obtained successfully');
    } catch (authError) {
      console.error('❌ Failed to get authentication header:', authError);
      const error = new Error('Authentication failed. Please log in again.');
      error.code = 'AUTH_FAILED';
      throw error;
    }
    
    if (!authHeader.Authorization) {
      console.error('❌ No authorization token available after getting auth header');
      const error = new Error('No authentication token available. Please log in again.');
      error.code = 'AUTH_FAILED';
      throw error;
    }

    // Step 1: Start streaming generation
    console.log('🚀 Iniciando request con streaming...');
    
    // Crear promesas para manejar tanto el response inicial como el streaming
    const streamingPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(`${API_URL}/stories/generate`, {
          ...storyData,
          email: user.email,
          enableStreaming: true
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeader
          },
          timeout: FETCH_TIMEOUT,
          withCredentials: true
        });

        const { streamId } = response.data;
        
        if (!streamId) {
          throw new Error('No stream ID received from server');
        }

        console.log('✅ StreamId recibido:', streamId);
        console.log('📡 Conectando al SSE inmediatamente...');

        // Step 2: Connect to SSE stream INMEDIATAMENTE
        const streamUrl = `${API_URL}/stories/stream?storyId=${streamId}`;
        console.log('🔗 [FRONTEND-SERVICE] Connecting to SSE URL:', streamUrl);
        
        // Configurar EventSource con opciones para producción
        const eventSourceConfig = {
          withCredentials: true, // Importante para HTTPS/producción
        };
        
        // En algunos navegadores/entornos, EventSource no acepta opciones, 
        // así que lo intentamos con configuración estándar
        let eventSource;
        try {
          eventSource = new EventSource(streamUrl, eventSourceConfig);
        } catch (error) {
          console.log('⚠️ [FRONTEND-SERVICE] EventSource with config failed, trying standard:', error.message);
          eventSource = new EventSource(streamUrl);
        }
        
        console.log('🔗 [FRONTEND-SERVICE] EventSource created, readyState:', eventSource.readyState);

        let accumulatedText = '';
        let connectionOpened = false;
        let storyCompleted = false; // Flag para detectar si ya se completó
        
        // Timeouts ajustados para producción (conexiones más lentas)
        const connectionTimeoutMs = config.isProduction ? 60000 : 30000; // 60s en prod, 30s en dev
        const completionTimeoutMs = config.isProduction ? 20000 : 10000; // 20s en prod, 10s en dev
        
        // Set timeout for initial connection
        const connectionTimeout = setTimeout(() => {
          if (!connectionOpened) {
            console.log('❌ [SSE] Connection timeout - no initial connection established');
            eventSource.close();
            reject(new Error('SSE_CONNECTION_FAILED'));
          }
        }, connectionTimeoutMs);
        
        // Timeout específico para el evento complete después de que se inicie la fase final
        let completionTimeout = null;
        const startCompletionTimeout = () => {
          if (completionTimeout) return; // Ya está configurado
          
          completionTimeout = setTimeout(() => {
            if (!storyCompleted && accumulatedText.length > 100) {
              console.log('⏰ [FRONTEND] Timeout esperando evento complete, usando texto acumulado');
              console.log('📝 [FRONTEND] Texto acumulado length:', accumulatedText.length);
              eventSource.close();
              resolve({
                title: 'Historia Generada',
                content: accumulatedText,
                contentWithTitle: accumulatedText
              });
            }
          }, completionTimeoutMs);
        };

        eventSource.onopen = (event) => {
          console.log('✅ [FRONTEND-SERVICE] SSE connection opened successfully', event);
          console.log('✅ [FRONTEND-SERVICE] EventSource readyState:', eventSource.readyState);
          connectionOpened = true;
          clearTimeout(connectionTimeout); // Clear connection timeout once connected
        };

        eventSource.addEventListener('textChunk', (event) => {
          try {
            console.log('📝 [FRONTEND-SERVICE] Raw textChunk event:', event.data);
            const data = JSON.parse(event.data);
            const chunk = data.content || data.chunk || '';
            accumulatedText += chunk;
            console.log('📝 [FRONTEND-SERVICE] Text chunk received:', chunk);
            console.log('📝 [FRONTEND-SERVICE] Accumulated text length:', accumulatedText.length);
            console.log('📝 [FRONTEND-SERVICE] onTextChunk callback exists?', !!onTextChunk);
            
            if (onTextChunk) {
              console.log('📝 [FRONTEND-SERVICE] Calling onTextChunk callback...');
              onTextChunk(chunk, accumulatedText);
              console.log('📝 [FRONTEND-SERVICE] onTextChunk callback executed');
            } else {
              console.error('❌ [FRONTEND-SERVICE] onTextChunk callback is missing!');
            }
          } catch (error) {
            console.error('❌ [FRONTEND-SERVICE] Error parsing text chunk:', error, 'Raw data:', event.data);
          }
        });

        eventSource.addEventListener('progress', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📊 [FRONTEND] Progress update:', data);
            
            if (onProgress) {
              onProgress(data);
            }
          } catch (error) {
            console.error('❌ [FRONTEND] Error parsing progress:', error);
          }
        });

        eventSource.addEventListener('phaseComplete', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('✅ [FRONTEND] Phase complete:', data.phase || data);
            
            // Si se completó la fase de historia, iniciar timeout para completion
            if (data.phase === 'story' || data.phaseName?.includes('historia') || data.phaseName?.includes('Historia')) {
              console.log('🕐 [FRONTEND] Fase de historia completada, iniciando timeout para completion');
              startCompletionTimeout();
            }
            
            if (onPhaseComplete) {
              onPhaseComplete(data);
            }
          } catch (error) {
            console.error('❌ [FRONTEND] Error parsing phase complete:', error);
          }
        });

        eventSource.addEventListener('complete', (event) => {
          try {
            console.log('🏁 [FRONTEND] Evento complete recibido, marcando como completado');
            storyCompleted = true; // Marcar como completado para evitar timeout
            
            // Cancelar el timeout de completion si existe
            if (completionTimeout) {
              clearTimeout(completionTimeout);
              completionTimeout = null;
              console.log('✅ [FRONTEND] Timeout de completion cancelado');
            }
            
            console.log('🏁 [FRONTEND] Story generation complete - raw event data length:', event.data ? event.data.length : 'No data');
            console.log('🏁 [FRONTEND] Raw event data preview:', event.data ? event.data.substring(0, 200) + '...' : 'No data');
            
            // Verificar si hay datos válidos
            if (!event.data || event.data === 'undefined') {
              console.log('⚠️ [FRONTEND] No data in complete event, using accumulated text as fallback');
              eventSource.close();
              // Usar el texto acumulado como resultado
              resolve({
                title: 'Historia Generada',
                content: accumulatedText,
                contentWithTitle: accumulatedText
              });
              return;
            }
            
            let data;
            try {
              data = JSON.parse(event.data);
              console.log('✅ [FRONTEND] Event data parsed successfully');
            } catch (parseError) {
              console.error('❌ [FRONTEND] Error parsing JSON:', parseError.message);
              console.log('📝 [FRONTEND] Falling back to accumulated text due to JSON parse error');
              eventSource.close();
              resolve({
                title: 'Historia Generada',
                content: accumulatedText,
                contentWithTitle: accumulatedText
              });
              return;
            }
            
            console.log('🏁 [FRONTEND] Final story result:', { 
              hasStory: !!data.story, 
              hasResultStory: !!data.result?.story,
              hasResult: !!data.result,
              contentLength: data.story?.content?.length || data.result?.story?.content?.length,
              accumulatedLength: accumulatedText.length,
              dataKeys: Object.keys(data),
              resultKeys: data.result ? Object.keys(data.result) : undefined
            });
            
            // Buscar la historia en diferentes ubicaciones posibles
            let finalStory = null;
            
            if (data.story) {
              // Formato directo
              finalStory = data.story;
              console.log('📖 [FRONTEND] Historia encontrada en data.story');
            } else if (data.result && data.result.story) {
              // Formato anidado (como viene del backend)
              finalStory = data.result.story;
              console.log('📖 [FRONTEND] Historia encontrada en data.result.story');
            } else if (data.result && typeof data.result === 'object' && data.result.title) {
              // El resultado es directamente la historia
              finalStory = data.result;
              console.log('📖 [FRONTEND] Historia encontrada directamente en data.result');
            }
            
            if (finalStory) {
              console.log('✅ [FRONTEND] Historia extraída exitosamente:', {
                title: finalStory.title,
                contentLength: finalStory.content?.length || finalStory.contentWithTitle?.length,
                hasContent: !!finalStory.content,
                hasContentWithTitle: !!finalStory.contentWithTitle
              });
              console.log('🎯 [FRONTEND] Resolviendo promesa con historia válida');
              eventSource.close();
              resolve(finalStory);
            } else {
              console.log('⚠️ [FRONTEND] No se encontró historia en el resultado');
              console.log('📊 [FRONTEND] Estructura completa del data:', JSON.stringify(data, null, 2));
              console.log('⚠️ [FRONTEND] Usando texto acumulado como fallback');
              eventSource.close();
              resolve({
                title: 'Historia Generada',
                content: accumulatedText,
                contentWithTitle: accumulatedText
              });
            }
          } catch (error) {
            console.error('❌ [FRONTEND] Error parsing completion:', error, 'Event data:', event.data);
            console.log('📝 [FRONTEND] Using accumulated text as fallback due to parse error');
            eventSource.close();
            // Usar el texto acumulado como resultado si falla el parsing
            resolve({
              title: 'Historia Generada',
              content: accumulatedText,
              contentWithTitle: accumulatedText
            });
          }
        });

        eventSource.addEventListener('error', (event) => {
          try {
            console.log('❌ SSE error event received:', event.data);
            
            // Si hay datos específicos del error, manejarlos
            if (event.data && event.data !== 'undefined') {
              const data = JSON.parse(event.data);
              console.error('❌ Stream error:', data.error);
              
              // Solo cerrar si es un error crítico
              if (data.error && data.error.includes('crítico')) {
                eventSource.close();
                reject(new Error(data.error));
                return;
              }
            }
            
            // Para otros errores, solo log y continuar
            console.log('⚠️ SSE error event, but continuing to wait for completion...');
            
          } catch (error) {
            console.log('⚠️ Error parsing SSE error event, continuing...', error.message);
          }
        });

        eventSource.onerror = (error) => {
          console.error('❌ SSE connection error:', error);
          console.log('📊 Connection details:', {
            readyState: eventSource.readyState,
            url: eventSource.url,
            connectionOpened,
            accumulatedTextLength: accumulatedText.length
          });
          
          // Solo rechazar si nunca se conectó exitosamente
          if (!connectionOpened) {
            console.log('❌ Connection never opened, falling back to traditional generation');
            eventSource.close();
            reject(new Error('SSE_CONNECTION_FAILED'));
            return;
          }
          
          // Si la conexión estaba abierta, esperar un poco antes de decidir qué hacer
          console.log('⚠️ Connection lost after opening, waiting for potential recovery...');
          
          // Dar tiempo para recibir el evento complete antes de cerrar
          setTimeout(() => {
            if (eventSource.readyState === EventSource.CLOSED) {
              console.log('📡 Connection already closed, checking if we have content...');
              
              // Si tenemos texto acumulado suficiente, usarlo como resultado
              if (accumulatedText.length > 100) {
                console.log('📝 Using accumulated text as fallback result (sufficient content)');
                resolve({
                  title: 'Historia Generada',
                  content: accumulatedText,
                  contentWithTitle: accumulatedText
                });
              } else {
                console.log('❌ Insufficient content accumulated, rejecting');
                reject(new Error('Connection error during streaming - insufficient content'));
              }
            }
          }, 2000); // Esperar 2 segundos para dar tiempo al evento complete
        };

        // Cleanup timeout after 10 minutes
        const timeoutId = setTimeout(() => {
          if (eventSource.readyState !== EventSource.CLOSED) {
            console.log('⏰ Streaming timeout, closing connection');
            eventSource.close();
            
            // If we have accumulated text, use it as fallback
            if (accumulatedText.length > 0) {
              console.log('📝 Using accumulated text after timeout');
              resolve({
                title: 'Historia Generada',
                content: accumulatedText,
                contentWithTitle: accumulatedText
              });
            } else {
              reject(new Error('Streaming timeout'));
            }
          }
        }, 600000);

        // Cleanup function to clear timeouts
        const cleanup = () => {
          clearTimeout(timeoutId);
          clearTimeout(connectionTimeout);
          if (completionTimeout) {
            clearTimeout(completionTimeout);
          }
          if (eventSource.readyState !== EventSource.CLOSED) {
            eventSource.close();
          }
        };
        
      } catch (error) {
        console.error('❌ Error iniciando streaming:', error);
        reject(error);
      }
    });

         // Retornar la promesa del streaming
     return streamingPromise;

  } catch (error) {
    console.error('❌ Error in streaming story generation request:', error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      const authError = new Error('Authentication failed. Please log in again.');
      authError.code = 'AUTH_FAILED';
      throw authError;
    }
    
    // Handle other errors similar to the original function
    if (error.response?.status === 403) {
      console.error('❌ Forbidden (403):', error.response.data);
      throw error;
    }
    
    if (error.response?.status === 500) {
      console.error('❌ Server error (500):', error.response.data);
      throw new Error('Server error. Please try again later.');
    }
    
    if (error.response?.status === 503) {
      console.error('❌ Service unavailable (503):', error.response.data);
      throw new Error('Service temporarily unavailable. Please try again later.');
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('❌ Network error');
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('❌ Request timeout');
      throw new Error('Request timed out. The server may be busy. Please try again.');
    }
    
    throw error;
  } finally {
    pendingRequest = false;
    console.log('Streaming request completed, pendingRequest set to false');
  }
};

// Add a health check function to test server connectivity
export const checkServerHealth = async () => {
  try {
    console.log('🔍 Checking server health...');
    
    // Multiple health endpoints to try (for production compatibility)
    const healthEndpoints = [
      `${API_URL}/health`,          // Backend: /api/health
      `${config.apiUrl}/health`,    // Backend: /health  
      `${API_URL}/stories/health`   // Story routes: /api/stories/health
    ];
    
    // First attempt with shorter timeout for fast response
    const tryHealthEndpoint = async (url, timeout) => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('timeout')), timeout);
        
        fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })
        .then(response => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
      });
    };
    
    // Try quick check on all endpoints
    for (const endpoint of healthEndpoints) {
      try {
        console.log(`🔍 Trying quick check on: ${endpoint}`);
        const response = await tryHealthEndpoint(endpoint, 4000); // 4 seconds for quick check
        
        if (response.ok) {
          console.log(`✅ Quick health check passed on: ${endpoint}`);
          try {
            const data = await response.json();
            return {
              healthy: true,
              status: 'ok',
              timestamp: data.timestamp,
              endpoint: endpoint,
              details: 'Server responded quickly'
            };
          } catch (parseError) {
            return {
              healthy: true,
              status: 'ok',
              endpoint: endpoint,
              details: 'Server responded but health data not parseable'
            };
          }
        }
      } catch (quickError) {
        console.log(`⚠️ Quick check failed on ${endpoint}: ${quickError.message}`);
        continue; // Try next endpoint
      }
    }
    
    console.log('⚠️ All quick checks failed, trying extended check for cold start...');
    
    // If all quick checks fail, try extended timeout for cold start scenario (Render can be very slow)
    for (const endpoint of healthEndpoints) {
      try {
        console.log(`🔍 Trying extended check on: ${endpoint}`);
        const response = await tryHealthEndpoint(endpoint, 25000); // 25 seconds for Render cold start
        
        if (response.ok) {
          console.log(`✅ Extended health check passed on: ${endpoint} (cold start detected)`);
          try {
            const data = await response.json();
            return {
              healthy: true,
              status: 'ok',
              timestamp: data.timestamp,
              endpoint: endpoint,
              details: 'Server responded after cold start delay',
              coldStart: true
            };
          } catch (parseError) {
            return {
              healthy: true,
              status: 'ok',
              endpoint: endpoint,
              details: 'Server responded after cold start but health data not parseable',
              coldStart: true
            };
          }
        } else {
          console.log(`❌ Server responded with error on ${endpoint}: ${response.status}`);
        }
      } catch (extendedError) {
        console.log(`❌ Extended check failed on ${endpoint}: ${extendedError.message}`);
        continue; // Try next endpoint
      }
    }
    
    // If all endpoints fail
    console.error('❌ All health check endpoints failed');
    return {
      healthy: false,
      status: 'timeout',
      details: 'Health check timed out on all endpoints - server may be unavailable',
      error: 'timeout',
      attemptedEndpoints: healthEndpoints
    };
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    
    // Return a friendly error response
    if (error.message === 'timeout' || error.message.includes('timeout')) {
      return {
        healthy: false,
        status: 'timeout',
        details: 'Health check timed out - server may be slow or unavailable',
        error: 'timeout'
      };
    }
    
    // Network errors can be temporary
    if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
      return {
        healthy: false,
        status: 'network_error',
        details: 'Network connectivity issues detected',
        error: 'network'
      };
    }
    
    return {
      healthy: false,
      status: 'error',
      details: `Connection error: ${error.message}`,
      error: error.message || error.name || 'unknown'
    };
  }
};

// OpenAI diagnostic function - can be run from browser console
export const diagnoseCuentosAPI = async () => {
  console.log('🏥 Running API diagnostics...');
  
  // 1. Check basic server health
  console.log('1️⃣ Checking server health...');
  try {
    const healthResponse = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Basic server health check passed:', healthData);
      
      if (healthData.openai_api_configured === false) {
        console.error('❌ OpenAI API not configured on server!');
        return false;
      }
    } else {
      console.error('❌ Basic server health check failed:', healthResponse.status, healthResponse.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to server:', error.message);
    return false;
  }
  
  // 2. Check OpenAI API health
  console.log('2️⃣ Checking OpenAI API health...');
  try {
    const openaiResponse = await fetch(`${API_URL}/stories/health/openai`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (openaiResponse.ok) {
      const openaiData = await openaiResponse.json();
      console.log('✅ OpenAI health check:', openaiData);
      
      if (openaiData.services?.openai !== 'ok') {
        console.error('❌ OpenAI API check failed:', openaiData.services?.openai);
        console.error('Error details:', openaiData.openai_error || 'No error details');
        return false;
      }
    } else {
      console.error('❌ OpenAI health check failed:', openaiResponse.status, openaiResponse.statusText);
      try {
        const errorData = await openaiResponse.json();
        console.error('Error details:', errorData);
      } catch {}
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking OpenAI health:', error.message);
    return false;
  }
  
  console.log('✨ All diagnostic checks passed!');
  return true;
};

// Log instructions for diagnosing issues from browser console
console.log(
  '%c📋 Cuentos API Diagnostic Instructions', 
  'font-size: 14px; font-weight: bold; color: blue;'
);
console.log(
  '%c- Run this in your browser console to diagnose API issues:\n' +
  '  await import(\'./services/storyService.js\').then(m => m.diagnoseCuentosAPI())',
  'font-size: 12px; color: #333;'
);

// Configure axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 120000 // 2 minutos de timeout
});

// Function to get current user's stories
export const getMyStories = async (page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const authHeader = await getAuthHeader();
    
    const response = await axios.get(`${API_URL}/stories/my-stories`, {
      params: { page, limit, sortBy, sortOrder },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeader
      },
      timeout: FETCH_TIMEOUT,
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching my stories:', error);
    throw error;
  }
};

// Function to get stories for a specific user (admin only)
export const getUserStories = async (userId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const authHeader = await getAuthHeader();

    const response = await axios.get(`${API_URL}/stories/user/${userId}`, {
      params: { page, limit, sortBy, sortOrder },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeader
      },
      timeout: FETCH_TIMEOUT,
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching user stories:', error);
    throw error;
  }
};

// Function to get a specific story by ID
export const getStoryById = async (storyId) => {
  try {
    const authHeader = await getAuthHeader();
    
    const response = await axios.get(`${API_URL}/stories/${storyId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeader
      },
      timeout: FETCH_TIMEOUT,
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching story by ID:', error);
    
    if (error.response && error.response.status === 404) {
      throw new Error('Story not found');
    }
    
    throw error;
  }
};

// Function to rate a story
export const rateStory = async (storyId, rating) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const authHeader = await getAuthHeader();

    const response = await axios.post(`${API_URL}/stories/${storyId}/rate`, 
      { rating },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeader
        },
        timeout: FETCH_TIMEOUT,
        withCredentials: true
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error rating story:', error);
    throw error;
  }
};

// Function to get story ratings
export const getStoryRatings = async (storyId) => {
  try {
    const authHeader = await getAuthHeader();
    
    const response = await axios.get(`${API_URL}/stories/${storyId}/ratings`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeader
      },
      timeout: FETCH_TIMEOUT,
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching story ratings:', error);
    throw error;
  }
};

// Get top rated stories
export const getTopRatedStories = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/stories/top-rated`, {
      params: { page, limit },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: FETCH_TIMEOUT,
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching top rated stories:', error);
    throw error;
  }
};

// Updated function to support fast audio generation
export const generateAudio = async (storyId, voiceId = 'female', speechRate = 1.0, musicTrack = 'none', fastMode = false) => {
  try {
    console.log('🎵 Starting audio generation request...');
    console.log('🔧 Audio parameters:', { voiceId, speechRate, musicTrack, fastMode });
    
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const authHeader = await getAuthHeader();
    
    const audioPayload = {
      voiceId,
      speechRate: parseFloat(speechRate),
      musicTrack,
      skipMixing: fastMode // NEW: Use fast mode for quicker generation
    };
    
    console.log('📡 Sending audio generation request with payload:', audioPayload);
    
    const response = await axios.post(`${API_URL}/stories/${storyId}/generate-audio`, audioPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeader
      },
      timeout: fastMode ? 60000 : 120000, // Shorter timeout for fast mode
      withCredentials: true
    });

    console.log('✅ Audio generation completed successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error generating audio:', error);
    
    if (error.response?.status === 401) {
      const authError = new Error('Authentication failed. Please log in again.');
      authError.code = 'AUTH_FAILED';
      throw authError;
    }
    
    if (error.response?.status === 404) {
      throw new Error('Story not found');
    }
    
    if (error.response?.status === 403) {
      throw new Error('Permission denied. You can only generate audio for your own stories.');
    }
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      const timeoutError = new Error(fastMode ? 
        'Audio generation timed out. Try using background music for longer texts.' :
        'Audio generation timed out. The server may be busy. Please try again.');
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    
    throw error;
  }
};

// Production diagnostic function - can be run from browser console
export const diagnoseProductionIssues = async () => {
  console.log('🏥 Running production diagnostics...');
  console.log('🌍 Current config:', {
    apiUrl: config.apiUrl,
    isProduction: config.isProduction,
    fullApiUrl: `${config.apiUrl}/api`
  });
  
  // Test multiple endpoints
  const testEndpoints = [
    `${config.apiUrl}/health`,
    `${config.apiUrl}/api/health`, 
    `${config.apiUrl}/api/stories/health`,
    `${config.apiUrl}/test`,
    `${config.apiUrl}/api/test`
  ];
  
  console.log('🔍 Testing endpoints:', testEndpoints);
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint}`);
      const startTime = Date.now();
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ Response time: ${duration}ms`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`✅ ${endpoint} - OK:`, data);
        } catch (parseError) {
          console.log(`✅ ${endpoint} - OK (non-JSON response)`);
        }
      } else {
        console.log(`❌ ${endpoint} - Failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
  
  // Test auth
  try {
    console.log('\n🔐 Testing authentication...');
    const authHeader = await getAuthHeader();
    console.log('✅ Auth header obtained successfully');
  } catch (authError) {
    console.log('❌ Auth failed:', authError.message);
  }
  
  console.log('\n✨ Production diagnostic complete!');
};

// Log instructions for production debugging
if (config.isProduction) {
  console.log(
    '%c🔧 AudioGretel Production Debug Commands',
    'color: #4CAF50; font-weight: bold; font-size: 14px;'
  );
  console.log(
    '%cRun these commands in console to debug issues:\n' +
    '• window.diagnoseProduction() - Full diagnostic\n' +
    '• window.checkHealth() - Health check only\n' +
    '• window.testAuth() - Test authentication',
    'color: #2196F3; font-size: 12px;'
  );
  
  // Expose functions to global scope for debugging
  window.diagnoseProduction = diagnoseProductionIssues;
  window.checkHealth = checkServerHealth;
  window.testAuth = async () => {
    try {
      const header = await getAuthHeader();
      console.log('✅ Auth test passed');
      return header;
    } catch (error) {
      console.log('❌ Auth test failed:', error);
      throw error;
    }
  };
}