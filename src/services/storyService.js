import i18n from 'i18next'; // Importar i18n para usar traducciones globales
import { getAuthHeader, getCurrentUser, refreshToken } from './authService';

// Determinar la URL correcta basada en el entorno
const isProduction = window.location.hostname !== 'localhost';
const API_URL = isProduction 
  ? 'https://generadorcuentos.onrender.com/api'
  : 'http://localhost:5001/api';

// URL base para el backend
const backendBaseUrl = isProduction
  ? 'https://generadorcuentos.onrender.com'
  : 'http://localhost:5001';

// Configuración común para fetch
const fetchConfig = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...getAuthHeader()
  },
  mode: 'cors',
  credentials: 'include'
};

export const generateStory = async (storyData) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const makeRequest = async (retry = false) => {
      try {
        const response = await fetch(`${API_URL}/stories/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({
            ...storyData,
            email: user.email
          }),
        });

        if (response.status === 401 && !retry) {
          // Token expired, try to refresh
          await refreshToken();
          // Retry the request with new token
          return makeRequest(true);
        }

        const data = await response.json();

        if (!response.ok) {
          throw {
            response: {
              data: {
                error: data.error,
                message: data.message
              }
            }
          };
        }

        return data;
      } catch (error) {
        if (error.message === 'Token expired' && !retry) {
          // Token expired, try to refresh
          await refreshToken();
          // Retry the request with new token
          return makeRequest(true);
        }
        throw error;
      }
    };

    return await makeRequest();
  } catch (error) {
    console.error('Story generation error:', error);
    throw error;
  }
};