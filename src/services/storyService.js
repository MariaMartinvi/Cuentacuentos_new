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

// Timeout en milisegundos (2 minutos)
const FETCH_TIMEOUT = 120000;

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
    
    if (!serverHealth.healthy) {
      console.error('Server health check failed:', serverHealth);
      
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

// Add a health check function to test server connectivity
export const checkServerHealth = async () => {
  try {
    console.log('🔍 Checking server health...');
    
    // Use a simple fetch with timeout promise race
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), 5000);
    });
    
    const fetchPromise = fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    // Process the response
    if (!response.ok) {
      return {
        healthy: false,
        status: 'error',
        statusCode: response.status,
        details: `Health check failed with status ${response.status} (${response.statusText})`
      };
    }

    // Parse the response
    const data = await response.json();
    console.log('✅ Health check response:', data);

    // Interpret the response from our enhanced health endpoint
    const result = {
      healthy: data.status === 'ok',
      status: data.status || 'unknown',
      timestamp: data.timestamp,
      services: data.services || {}
    };

    // Add more details if available
    if (data.services) {
      if (data.services.openai !== 'ok') {
        result.details = 'The AI service is experiencing issues';
        
        if (data.services.openai_quota === 'exceeded') {
          result.issue = 'openai_quota_exceeded';
          result.details = 'AI service quota has been exceeded';
        }
      }
      
      if (data.services.database !== 'ok') {
        result.details = (result.details ? result.details + '. ' : '') + 'Database connection issues';
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Health check error:', error);
    
    // Return a friendly error response
    if (error.message === 'timeout') {
      return {
        healthy: false,
        status: 'timeout',
        details: 'Health check timed out - server may be slow or unavailable',
        error: 'timeout'
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