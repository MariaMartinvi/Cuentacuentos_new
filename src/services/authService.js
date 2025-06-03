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
    
    const response = await axiosInstance.post('/api/auth/register', {
      email,
      password
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
    const loginUrl = `${API_URL}/api/auth/login`;
    
    console.log('Making login request to:', loginUrl);
    
    const response = await retryRequest(async () => {
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
    
    if (!response.data || !response.data.token) {
      throw new Error('Invalid response format from server');
    }

    const { token } = response.data;
    // Extract user data from nested structure
    const user = response.data.data || response.data.user;
    
    if (!user) {
      throw new Error('No user data received from server');
    }
    
    console.log('Extracted user data:', user);
    
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
    
    return { token, user };
  } catch (error) {
    console.error('Login error:', error);
    if (error.response?.status === 401) {
      throw new Error(error.response.data.details || i18next.t('login.error'));
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
    
    // Extract user data from the nested response structure
    const userData = response.data.data || response.data;
    
    console.log('Extracted user data:', userData);
    
    // Actualizar caché
    userCache = {
      data: userData,
      timestamp: now
    };
    
    return userData;
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

// Email verification function
export const verifyEmail = async (token) => {
  try {
    console.log('🔍 [AuthService] Starting email verification with token:', token);
    
    const verifyUrl = `${API_URL}/api/auth/verify-email?token=${token}`;
    console.log('🌐 [AuthService] Making request to:', verifyUrl);

    const response = await axios.get(verifyUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 20000 // Increased timeout to 20 seconds for email verification
    });

    console.log('✅ [AuthService] Verification response status:', response.status);
    console.log('📦 [AuthService] Verification response data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('💥 [AuthService] Email verification error:', error);
    console.error('🔍 [AuthService] Error breakdown:', {
      message: error.message,
      code: error.code,
      response_status: error.response?.status,
      response_data: error.response?.data,
      response_headers: error.response?.headers
    });
    
    // If it's a timeout error, try once more with a longer timeout
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.log('⏰ [AuthService] Timeout detected, retrying with longer timeout...');
      try {
        const response = await axios.get(`${API_URL}/api/auth/verify-email?token=${token}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000 // 30 seconds retry
        });
        console.log('✅ [AuthService] Retry successful:', response.data);
        return response.data;
      } catch (retryError) {
        console.error('💥 [AuthService] Retry failed:', retryError);
        throw new Error('Timeout al verificar el email. La verificación puede haberse completado, prueba a iniciar sesión.');
      }
    }
    
    if (error.response?.data?.details) {
      throw new Error(error.response.data.details);
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (!error.response) {
      throw new Error('Network error - Unable to connect to the server');
    } else {
      throw new Error(error.message || 'Email verification failed');
    }
  }
};

// Resend email verification
export const resendVerificationEmail = async (email) => {
  try {
    console.log('Resending verification email to:', email);
    
    const resendUrl = `${API_URL}/api/auth/resend-verification`;
    console.log('Making resend verification request to:', resendUrl);

    const response = await axios.post(resendUrl, {
      email
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    console.log('Resend verification response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Resend verification error:', error);
    
    if (error.response?.data?.details) {
      throw new Error(error.response.data.details);
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (!error.response) {
      throw new Error('Network error - Unable to connect to the server');
    } else {
      throw new Error(error.message || 'Failed to resend verification email');
    }
  }
};

// Forgot password function
export const forgotPassword = async (email) => {
  try {
    console.log('Requesting password reset for:', email);
    
    const forgotUrl = `${API_URL}/api/auth/forgot-password`;
    console.log('Making forgot password request to:', forgotUrl);

    const response = await axios.post(forgotUrl, {
      email
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    console.log('Forgot password response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    
    if (error.response?.data?.details) {
      throw new Error(error.response.data.details);
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (!error.response) {
      throw new Error('Network error - Unable to connect to the server');
    } else {
      throw new Error(error.message || 'Failed to process password reset request');
    }
  }
};

// Reset password function
export const resetPassword = async (token, newPassword) => {
  try {
    console.log('Resetting password with token');
    
    const resetUrl = `${API_URL}/api/auth/reset-password`;
    console.log('Making reset password request to:', resetUrl);

    const response = await axios.post(resetUrl, {
      token,
      newPassword
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    console.log('Reset password response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error.response?.data?.details) {
      throw new Error(error.response.data.details);
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (!error.response) {
      throw new Error('Network error - Unable to connect to the server');
    } else {
      throw new Error(error.message || 'Failed to reset password');
    }
  }
}; 