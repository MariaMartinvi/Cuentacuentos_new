import axios from 'axios';
import { loadStripe as loadStripeJs } from '@stripe/stripe-js';

// Determine the correct API URL based on environment
const isProduction = window.location.hostname !== 'localhost';
const API_URL = isProduction 
  ? 'https://generadorcuentos.onrender.com'
  : 'http://localhost:5001';

// Configure axios defaults
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add auth token to requests
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create a checkout session
export const createCheckoutSession = async (email) => {
  try {
    console.log('Creating checkout session for:', email);
    console.log('Using API URL:', API_URL);

    const response = await axiosInstance.post('/api/stripe/create-checkout-session', {
      email,
      successUrl: `${window.location.origin}/success`,
      cancelUrl: `${window.location.origin}/subscribe`
    });

    console.log('Checkout session created:', response.data);
    
    if (!response.data?.url) {
      throw new Error('No checkout URL received');
    }

    // Redirect to the checkout URL
    window.location.href = response.data.url;
    
    return response.data;
  } catch (error) {
    console.error('Error creating checkout session:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/stripe/create-checkout-session`,
      email: email,
      error: error
    });
    throw error;
  }
};

// Load Stripe
export const loadStripe = async () => {
  try {
    const stripe = await loadStripeJs('pk_test_51RHQND2VwHWYt9L3y3Sh7y6UZ3Cwr4E5M1yNLLkby7g8M6VRsECRTzz9kEtQQEFXbnvcP83l6H2QTkEoDiLs8itj00lkp4ysmv');
    return stripe;
  } catch (error) {
    console.error('Error loading Stripe:', error);
    throw error;
  }
};

// Other methods remain the same
export const verifySubscription = async (sessionId) => {
  try {
    console.log('Verifying subscription with session ID:', sessionId);
    const response = await axiosInstance.get('/api/stripe/success', {
      params: { session_id: sessionId }
    });
    console.log('Subscription verification response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Subscription verification error:', error);
    throw error;
  }
};

export const getSubscriptionStatus = async () => {
  try {
    const response = await axiosInstance.get('/api/stripe/subscription-status');
    return response.data;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
};

export const cancelSubscription = async () => {
  try {
    const response = await axiosInstance.post('/api/stripe/cancel-subscription');
    return response.data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};