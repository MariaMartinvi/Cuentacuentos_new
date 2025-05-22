import axios from 'axios';
import i18next from 'i18next';
import config from '../config';

// Use API URL from config
const API_URL = config.apiUrl;

console.log('AuthService - Using API URL:', API_URL);

// Cache para getCurrentUser
let userCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 5000 // 5 segundos
};

// Configure axios defaults
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 segundos de timeout
});

// Interceptor para agregar el token a las peticiones
axiosInstance.interceptors.request.use(config => {
  console.log('Making request to:', `${API_URL}${config.url}`);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de red
axiosInstance.interceptors.response.use(
  response => {
    console.log('Response received:', response.status);
    return response;
  },
  error => {
    console.error('Request failed:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.message
    });

    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - Unable to connect to the server');
      throw new Error('Unable to connect to the server. Please check if the backend server is running.');
    }
    
    // Handle rate limiting errors
    if (error.response && error.response.status === 429) {
      console.error('Rate limiting error - Too many requests');
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    return Promise.reject(error);
  }
);

// Retrying mechanism for rate limited requests
const retryRequest = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Only retry on rate limit errors
      if (error.response && error.response.status === 429) {
        console.log(`Request rate limited. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        // Wait for the specified delay before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        // Increase delay for next attempt (exponential backoff)
        delay *= 2;
      } else {
        // If it's not a rate limit error, don't retry
        throw error;
      }
    }
  }
  
  // If we've exhausted all retries
  throw lastError;
};

export const register = async (email, password) => {
  try {
    console.log('Registering user:', email);
    
    // Use API_URL constant instead of hardcoded URL
    const registerUrl = `${API_URL}/api/auth/register`;
    
    console.log('Making register request to:', registerUrl);

    const response = await axios.post(registerUrl, {
      email,
      password
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    console.log('Registration successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      error: error
    });
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.data?.details) {
      throw new Error(`${error.response.data.error}: ${error.response.data.details}`);
    } else if (!error.response) {
      throw new Error('Network error - Unable to connect to the server. Please check if the backend server is running.');
    } else {
      throw new Error(error.message || 'Registration failed');
    }
  }
};

export const login = async (email, password) => {
  try {
    // Use API_URL constant instead of hardcoded URL
    const loginUrl = `${API_URL}/api/auth/login`;
    
    console.log('Making login request to:', loginUrl);
    
    // Use the retrying mechanism for login requests
    const response = await retryRequest(async () => {
      // Usar axios directamente con la URL completa en lugar de la instancia configurada
      return await axios.post(loginUrl, {
        email,
        password
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
    });
    
    console.log('Login response:', response.data);
    
    if (!response.data || !response.data.token || !response.data.user) {
      throw new Error('Invalid response format from server');
    }

    const { token, user } = response.data;
    
    // Guardar token y usuario en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Limpiar caché al hacer login
    userCache = {
      data: user,
      timestamp: Date.now()
    };
    
    // Verificar que se guardaron correctamente
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    console.log('Token saved in localStorage:', savedToken ? 'Yes' : 'No');
    console.log('User saved in localStorage:', savedUser ? 'Yes' : 'No');
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error.response?.status === 401) {
      throw new Error(i18next.t('login.error'));
    } else if (error.response?.status === 429) {
      throw new Error(i18next.t('login.rateLimitError') || 'Too many login attempts. Please try again later.');
    }
    throw error;
  }
};

export const logout = () => {
  const user = getCurrentUser();
  console.log('Logging out user:', user?.email);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Limpiar caché al hacer logout
  userCache = {
    data: null,
    timestamp: null
  };
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log('Checking token in getCurrentUser:', token ? 'Token exists' : 'No token found');
    
    if (!token) {
      userCache = { data: null, timestamp: null };
      return null;
    }

    // Verificar si hay datos en caché y si son válidos
    const now = Date.now();
    if (userCache.data && userCache.timestamp && (now - userCache.timestamp < userCache.CACHE_DURATION)) {
      console.log('Returning cached user data');
      return userCache.data;
    }

    // Use API_URL constant instead of hardcoded URL
    const currentUserUrl = `${API_URL}/api/auth/me`;
    
    console.log('Making request to get current user at:', currentUserUrl);

    const response = await axios.get(currentUserUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true,
      timeout: 10000
    });

    console.log('Response from /api/auth/me:', response.data);
    
    // Actualizar caché
    userCache = {
      data: response.data,
      timestamp: now
    };
    
    return response.data;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    // En caso de error, limpiar caché
    userCache = { data: null, timestamp: null };
    return null;
  }
};

export const getAuthHeader = () => {
  try {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    console.error('Error getting auth header:', error);
    return {};
  }
};

// Función para refrescar el token
export const refreshToken = async () => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('No user found');
    }

    // Use API_URL constant instead of hardcoded URL
    const refreshUrl = `${API_URL}/auth/refresh-token`;
    
    console.log('Refreshing token at:', refreshUrl);

    const response = await axios.post(refreshUrl, {
      email: user.email
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify({
        ...user,
        token: response.data.token
      }));
      return response.data.token;
    }
    throw new Error('No token received');
  } catch (error) {
    console.error('Token refresh failed:', error);
    logout(); // Clear user data if refresh fails
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const googleLoginUrl = `${API_URL}/auth/google`;
    
    console.log('Making Google login request to:', googleLoginUrl);

    const response = await fetch(googleLoginUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include',
      // Add timeout configuration
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to initiate Google login');
    }

    const data = await response.json();
    
    if (!data.token) {
      throw new Error('No token received from server');
    }
    
    // Store the token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Google login error:', error);
    if (error.name === 'AbortError') {
      throw new Error('Login request timed out. Please try again.');
    }
    throw error;
  }
}; 