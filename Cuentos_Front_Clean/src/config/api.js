// Configuración de la API
const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';

export const API_URL = isProduction 
  ? 'https://generadorcuentos.onrender.com'
  : 'http://localhost:5001';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout'
  },
  STRIPE: {
    CREATE_CHECKOUT: '/api/stripe/create-checkout-session',
    SUCCESS: '/api/stripe/success',
    CANCEL: '/api/stripe/cancel',
    SUBSCRIPTION_STATUS: '/api/stripe/subscription-status'
  },
  STORIES: {
    GENERATE: '/api/stories/generate'
  },
  AUDIO: {
    GENERATE: '/api/audio/generate'
  },
  CONTACT: {
    SEND: '/api/contact'
  }
};

// Configuración de axios
export const axiosConfig = {
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}; 