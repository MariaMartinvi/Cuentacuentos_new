// audioService.js
import { getAuthHeader, refreshToken } from './authService';

// Configuración de timeout para la generación de audio (8 minutos para audios largos)
const AUDIO_GENERATION_TIMEOUT = 480 * 1000;

// Función para crear un timeout
const createTimeout = (ms) => {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('La solicitud ha excedido el tiempo de espera')), ms)
  );
};

// Función para hacer fetch con timeout
const fetchWithTimeout = async (url, options, timeout) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('La solicitud ha excedido el tiempo de espera');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const generateAudio = async (options) => {
  try {
    // Extract properties from options object
    const { text, voiceId, speechRate, musicTrack, pauseSettings, title, storyId } = options;
    
    // Verify that text is a valid string
    if (typeof text !== 'string') {
      console.error('❌ Error: text is not a valid string', text);
      throw new Error('El texto para generar audio debe ser una cadena de texto válida');
    }

    console.log('🔊 Iniciando generación de audio');
    console.log('📝 Texto:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    console.log('🎙️ Voz:', voiceId);
    console.log('⏩ Velocidad:', speechRate || 'normal');
    console.log('🎵 Música de fondo:', musicTrack === 'none' ? 'Sin música' : (musicTrack || 'random'));
    console.log('📖 Título:', title || 'No title provided');
    console.log('📋 Story ID:', storyId || 'No story ID provided');
    console.log('⏸️ Pausas personalizadas:', pauseSettings ? 'Habilitadas' : 'Deshabilitadas');
    if (pauseSettings) {
      console.log('⏸️ Configuración de pausas:', pauseSettings);
    }
    
    // Determine the correct URL based on environment
    const isProduction = window.location.hostname !== 'localhost';
    const audioFunctionUrl = isProduction 
      ? 'https://generadorcuentos.onrender.com/api/audio/generate'
      : 'http://localhost:5001/api/audio/generate';

    console.log('🌐 URL de la función de audio:', audioFunctionUrl);

    // Preparar datos para la solicitud
    const requestData = { 
      text, 
      voiceId, 
      speechRate,
      musicTrack: musicTrack, // Asegurarnos de enviar el valor exacto, incluyendo 'none'
      pauseSettings: pauseSettings, // Incluir configuraciones de pausas
      title: title, // Incluir el título para detección automática de pausas
      storyId: storyId // Incluir storyId para que el backend pueda guardar datos temporales
    };

    console.log('📦 Datos de la solicitud:', JSON.stringify({
      ...requestData,
      text: requestData.text.substring(0, 50) + '...'
    }, null, 2));

    const makeRequest = async (retry = false) => {
      try {
        console.log(`${retry ? '🔄 Reintentando' : '🚀 Iniciando'} solicitud de audio...`);
        
        // Crear la solicitud con un timeout
        const response = await fetchWithTimeout(
          audioFunctionUrl,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...getAuthHeader()
            },
            body: JSON.stringify(requestData),
            credentials: 'include'
          },
          AUDIO_GENERATION_TIMEOUT
        );

        console.log('📨 Respuesta recibida con estado:', response.status);

        // Si el token está expirado, refrescarlo y reintentar
        if (response.status === 401 && !retry) {
          console.log('🔑 Token expirado, intentando refrescar...');
          await refreshToken();
          return makeRequest(true);
        }

        if (!response.ok) {
          console.error('❌ Error en la respuesta:', response.status);
          let errorMessage = `Error del servidor: ${response.status}`;
          
          try {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            errorMessage = errorText || errorMessage;
          } catch (e) {
            console.error('Error al leer la respuesta de error:', e);
          }
          
          throw new Error(errorMessage);
        }

        console.log('✅ Respuesta exitosa, procesando datos...');
        const data = await response.json();
        console.log('🎵 Audio generado correctamente');
        return data;
      } catch (error) {
        console.error('❌ Error durante la solicitud de audio:', error.message);
        
        if (error.message.includes('tiempo de espera')) {
          console.error('⏱️ La solicitud ha excedido el tiempo de espera');
          throw new Error('La generación del audio está tomando más tiempo del esperado. Por favor, inténtalo de nuevo o usa un texto más corto.');
        }
        
        if (error.message === 'Token expired' && !retry) {
          console.log('🔑 Token expirado, intentando refrescar...');
          await refreshToken();
          return makeRequest(true);
        }
        
        throw error;
      }
    };

    return await makeRequest();
  } catch (error) {
    console.error('❌ Error generando audio:', error);
    
    // Proporcionar un mensaje de error más amigable para el usuario
    let userFriendlyMessage = error.message;
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      userFriendlyMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.';
    } else if (error.message.includes('tiempo de espera')) {
      userFriendlyMessage = 'La generación del audio está tomando más tiempo del esperado. Intenta con un texto más corto.';
    }
    
    throw new Error(userFriendlyMessage);
  }
};

export const testPauses = async (text, pauseSettings) => {
  try {
    console.log('🧪 Iniciando test de pausas...', { text: text.substring(0, 50) + '...', pauseSettings });
    
    // Determine the correct URL based on environment
    const isProduction = window.location.hostname !== 'localhost';
    const testPausesUrl = isProduction 
      ? 'https://generadorcuentos.onrender.com/api/audio/test-pauses'
      : 'http://localhost:5001/api/audio/test-pauses';

    console.log('🌐 URL del test de pausas:', testPausesUrl);
    
    const response = await fetch(testPausesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        pauseSettings
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Test de pausas completado:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en test de pausas:', error);
    throw new Error(`Error testing pauses: ${error.message}`);
  }
};