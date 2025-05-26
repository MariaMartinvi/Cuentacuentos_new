import i18n from 'i18next'; // Importar i18n para usar traducciones globales
import { getAuthHeader, getCurrentUser, refreshToken } from './authService';
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
  console.log('generateStory called with data:', storyData);
  
  // Si ya hay una solicitud en curso, no permitir otra
  if (pendingRequest) {
    console.log('⏳ A story generation request is already in progress');
    throw new Error('A story generation request is already in progress');
  }

  try {
    // Marcar que hay una solicitud en curso
    pendingRequest = true;
    console.log('Request marked as pending');
    
    const user = await getCurrentUser();
    if (!user) {
      console.log('No authenticated user found');
      pendingRequest = false;
      throw new Error('User not authenticated');
    }

    // Check server health before making the request
    console.log('Checking server health...');
    const serverHealth = await checkServerHealth();
    if (!serverHealth.healthy) {
      console.error('Server health check failed:', serverHealth.details);
      pendingRequest = false;
      throw {
        response: {
          data: {
            error: 'Server unavailable',
            message: i18n.language === 'es'
              ? `El servidor no está disponible en este momento. Error: ${serverHealth.details}`
              : `The server is currently unavailable. Error: ${serverHealth.details}`
          }
        }
      };
    }

    console.log('Making story generation request...');
    const response = await axios.post(`${API_URL}/stories/generate`, {
      ...storyData,
      email: user.email
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...getAuthHeader()
      },
      timeout: FETCH_TIMEOUT,
      withCredentials: true
    });

    console.log('Story generated successfully');
    return response.data;
  } catch (error) {
    console.error('Error in story generation request:', error);
    throw error;
  } finally {
    pendingRequest = false;
    console.log('Request completed, pendingRequest set to false');
  }
};

// Add a health check function to test server connectivity
export const checkServerHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      // Try OPTIONS request first for CORS check
      try {
        const optionsResponse = await fetch(`${API_URL}/health`, {
          method: 'OPTIONS',
          signal: controller.signal
        });
        
        if (optionsResponse.status >= 400) {
          return { 
            healthy: false, 
            details: `CORS preflight failed with status ${optionsResponse.status}` 
          };
        }
      } catch (corsError) {
        console.warn('CORS preflight check failed:', corsError);
        // Continue even if OPTIONS fails, as some servers might not support it
      }
      
      // Main health check request
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

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
      console.log('Health check response:', data);

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
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Health check error:', error);
    
    // Return a friendly error response
    return {
      healthy: false,
      status: 'error',
      details: error.name === 'AbortError' 
        ? 'Health check timed out' 
        : `Connection error: ${error.message}`,
      error: error.message
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