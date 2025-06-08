import axios from 'axios';
import i18next from 'i18next';
import config from '../config';
import { auth, db } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification as firebaseSendEmailVerification,
  applyActionCode,
  reload,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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
    console.log('🔥 Registering with Firebase Auth:', email);
    
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('✅ Firebase registration successful:', firebaseUser.email);
    
    // Send email verification
    await firebaseSendEmailVerification(firebaseUser);
    console.log('📧 Email verification sent to:', firebaseUser.email);
    
    // Sign out immediately - user must verify email before logging in
    await signOut(auth);
    console.log('🚪 User signed out - must verify email before logging in');
    
    return { 
      success: true,
      message: i18next.t('messages.emailVerified'),
      emailSent: true
    };
  } catch (error) {
    console.error('❌ Firebase registration error:', error);
    
    // Handle Firebase Auth errors
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error(i18next.t('register.emailAlreadyInUse') || 'Ya existe una cuenta con este email');
      case 'auth/invalid-email':
        throw new Error(i18next.t('firebaseErrors.invalidEmail'));
      case 'auth/operation-not-allowed':
        throw new Error(i18next.t('register.notAllowed') || 'Registro no permitido');
      case 'auth/weak-password':
        throw new Error(i18next.t('firebaseErrors.weakPassword'));
      default:
        throw new Error(error.message || i18next.t('register.error'));
    }
  }
};

export const login = async (email, password) => {
  try {
    console.log('🔥 Logging in with Firebase Auth:', email);
    
    // Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('✅ Firebase Auth successful:', firebaseUser.email);
    
    // Check if email is verified
    if (!firebaseUser.emailVerified) {
      // Sign out the user immediately
      await signOut(auth);
      throw new Error(i18next.t('login.emailNotVerified') || 'Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
    }
    
    // Get Firebase ID token
    const token = await firebaseUser.getIdToken();
    
    // Get real user data from Firestore
    console.log('🔄 Fetching user data from Firestore after login...');
    const firestoreUserData = await getOrCreateUserData(firebaseUser);
    
    // Create user object with real data from Firestore
    const user = {
      email: firebaseUser.email,
      uid: firebaseUser.uid,
      emailVerified: firebaseUser.emailVerified,
      // Real data from Firestore (no hardcoded values!)
      storiesGenerated: firestoreUserData.storiesGenerated || 0,
      monthlyStoriesGenerated: firestoreUserData.monthlyStoriesGenerated || 0,
      subscriptionStatus: firestoreUserData.subscriptionStatus || 'free',
      isPremium: firestoreUserData.isPremium || false,
      isAdmin: firestoreUserData.isAdmin || false,
      lastMonthReset: firestoreUserData.lastMonthReset,
      createdAt: firestoreUserData.createdAt,
      updatedAt: firestoreUserData.updatedAt
    };
    
    // Save to localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update cache
    userCache = {
      data: user,
      timestamp: Date.now()
    };
    
    console.log('💾 User data saved with real Firestore data:', {
      email: user.email,
      storiesGenerated: user.storiesGenerated,
      monthlyStoriesGenerated: user.monthlyStoriesGenerated,
      subscriptionStatus: user.subscriptionStatus,
      isPremium: user.isPremium
    });
    
    return { token, user };
  } catch (error) {
    console.error('❌ Firebase login error:', error);
    
    // Handle Firebase Auth errors
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error(i18next.t('firebaseErrors.userNotFound'));
      case 'auth/wrong-password':
        throw new Error(i18next.t('login.wrongPassword') || 'Contraseña incorrecta');
      case 'auth/invalid-email':
        throw new Error(i18next.t('firebaseErrors.invalidEmail'));
      case 'auth/user-disabled':
        throw new Error(i18next.t('login.userDisabled') || 'Esta cuenta ha sido deshabilitada');
      case 'auth/too-many-requests':
        throw new Error(i18next.t('firebaseErrors.tooManyRequests'));
      default:
        throw new Error(error.message || i18next.t('login.error'));
    }
  }
};

export const logout = async () => {
  try {
    const user = getCurrentUser();
    console.log('🚪 Logging out user:', user?.email);
    
    // Sign out from Firebase Auth
    await signOut(auth);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear cache
    userCache = {
      data: null,
      timestamp: null
    };
    
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Still clear local data even if Firebase signout fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    userCache = { data: null, timestamp: null };
  }
};

// Helper function to get or create user data in Firestore
const getOrCreateUserData = async (firebaseUser) => {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log('📁 User found in Firestore:', firebaseUser.email);
      const userData = userDoc.data();
      
      // Check and reset monthly count if needed
      const now = new Date();
      const lastReset = userData.lastMonthReset ? userData.lastMonthReset.toDate() : new Date();
      
      if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        console.log('🔄 Resetting monthly story count for user:', firebaseUser.email);
        const updatedData = {
          ...userData,
          monthlyStoriesGenerated: 0,
          lastMonthReset: now,
          updatedAt: now
        };
        
        await updateDoc(userRef, {
          monthlyStoriesGenerated: 0,
          lastMonthReset: now,
          updatedAt: now
        });
        
        return { id: userDoc.id, ...updatedData };
      }
      
      return { id: userDoc.id, ...userData };
    } else {
      console.log('👤 Creating new user in Firestore:', firebaseUser.email);
      const newUserData = {
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified || false,
        firebase_uid: firebaseUser.uid,
        storiesGenerated: 0,
        monthlyStoriesGenerated: 0,
        subscriptionStatus: 'free',
        isPremium: false,
        isAdmin: false,
        lastMonthReset: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(userRef, newUserData);
      console.log('✅ New user created in Firestore');
      return { id: firebaseUser.uid, ...newUserData };
    }
  } catch (error) {
    console.error('❌ Error getting/creating user data from Firestore:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    // Check Firebase Auth current user
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      console.log('No Firebase user found');
      userCache = { data: null, timestamp: null };
      return null;
    }

    // Check cache first (but only for a short time to ensure data freshness)
    const now = Date.now();
    if (userCache.data && userCache.timestamp && (now - userCache.timestamp) < userCache.CACHE_DURATION) {
      console.log('Returning cached user data:', userCache.data.email);
      return userCache.data;
    }

    console.log('🔄 Fetching fresh user data from Firestore for:', firebaseUser.email);
    
    // Get real user data from Firestore
    const firestoreUserData = await getOrCreateUserData(firebaseUser);
    
    // Create complete user object with real data from Firestore
    const user = {
      email: firebaseUser.email,
      uid: firebaseUser.uid,
      emailVerified: firebaseUser.emailVerified,
      // Real data from Firestore (no hardcoded values!)
      storiesGenerated: firestoreUserData.storiesGenerated || 0,
      monthlyStoriesGenerated: firestoreUserData.monthlyStoriesGenerated || 0,
      subscriptionStatus: firestoreUserData.subscriptionStatus || 'free',
      isPremium: firestoreUserData.isPremium || false,
      isAdmin: firestoreUserData.isAdmin || false,
      lastMonthReset: firestoreUserData.lastMonthReset,
      createdAt: firestoreUserData.createdAt,
      updatedAt: firestoreUserData.updatedAt
    };
    
    // Update cache with real data
    userCache = {
      data: user,
      timestamp: now
    };
    
    // Save real data to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    console.log('✅ Real user data fetched from Firestore:', {
      email: user.email,
      storiesGenerated: user.storiesGenerated,
      monthlyStoriesGenerated: user.monthlyStoriesGenerated,
      subscriptionStatus: user.subscriptionStatus,
      isPremium: user.isPremium
    });
    
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    
    // Fallback to localStorage if available, but warn about potential inconsistency
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        console.warn('⚠️ Using cached user data due to Firestore error. Data may be inconsistent.');
        return userData;
      } catch (e) {
        console.warn('Error parsing cached user data:', e);
      }
    }
    
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

// Email verification function (updated for Firebase)
export const verifyEmail = async (actionCode) => {
  try {
    console.log('🔍 [AuthService] Starting Firebase email verification');
    
    return await handleEmailVerification(actionCode);
  } catch (error) {
    console.error('💥 [AuthService] Email verification error:', error);
    throw error;
  }
};

// Resend email verification (updated for Firebase)
export const resendVerificationEmail = async () => {
  try {
    console.log('📧 Resending Firebase email verification');
    
    return await sendEmailVerification();
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    throw error;
  }
};

// Firebase forgot password function  
export const forgotPassword = async (email) => {
  try {
    console.log('Sending Firebase password reset email to:', email);
    
    await firebaseSendPasswordResetEmail(auth, email);
    
    console.log('✅ Firebase password reset email sent successfully');
    
    return {
      success: true,
      message: i18next.t('messages.forgotPasswordSuccess')
    };
  } catch (error) {
    console.error('❌ Firebase forgot password error:', error);
    
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error(i18next.t('firebaseErrors.userNotFound'));
      case 'auth/invalid-email':
        throw new Error(i18next.t('firebaseErrors.invalidEmail'));
      case 'auth/too-many-requests':
        throw new Error(i18next.t('firebaseErrors.tooManyRequests'));
      default:
        throw new Error(error.message || i18next.t('forgotPassword.recoveryError'));
    }
  }
};

// Firebase confirm password reset function
export const resetPassword = async (actionCode, newPassword) => {
  try {
    console.log('🔍 Confirming Firebase password reset with action code');
    
    // Confirm the password reset with the action code
    await confirmPasswordReset(auth, actionCode, newPassword);
    
    console.log('✅ Firebase password reset successful');
    
    return {
      success: true,
      message: i18next.t('resetPassword.success')
    };
  } catch (error) {
    console.error('❌ Firebase reset password error:', error);
    
    switch (error.code) {
      case 'auth/expired-action-code':
        throw new Error(i18next.t('firebaseErrors.expiredActionCode'));
      case 'auth/invalid-action-code':
        throw new Error(i18next.t('firebaseErrors.invalidActionCode'));
      case 'auth/weak-password':
        throw new Error(i18next.t('firebaseErrors.weakPassword'));
      default:
        throw new Error(error.message || i18next.t('messages.passwordResetError'));
    }
  }
};

// Verify password reset code (to check if the code is valid before showing reset form)
export const verifyPasswordResetCode = async (actionCode) => {
  try {
    console.log('🔍 Verifying Firebase password reset code');
    
    // Verify the password reset code is valid
    const email = await firebaseVerifyPasswordResetCode(auth, actionCode);
    
    console.log('✅ Password reset code verified for email:', email);
    
    return {
      success: true,
      email: email
    };
  } catch (error) {
    console.error('❌ Firebase verify password reset code error:', error);
    
    switch (error.code) {
      case 'auth/expired-action-code':
        throw new Error(i18next.t('firebaseErrors.expiredActionCode'));
      case 'auth/invalid-action-code':
        throw new Error(i18next.t('firebaseErrors.invalidActionCode'));
      default:
        throw new Error(i18next.t('resetPassword.linkInvalid'));
    }
  }
};

// Send Firebase email verification
export const sendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }
    
    if (user.emailVerified) {
      throw new Error('El email ya está verificado');
    }
    
    await firebaseSendEmailVerification(user);
    console.log('📧 Email verification sent to:', user.email);
    
    return {
      success: true,
      message: 'Email de verificación enviado. Revisa tu bandeja de entrada.'
    };
  } catch (error) {
    console.error('❌ Error sending email verification:', error);
    
    switch (error.code) {
      case 'auth/too-many-requests':
        throw new Error('Demasiados intentos. Espera un momento antes de intentar de nuevo.');
      case 'auth/user-disabled':
        throw new Error('Esta cuenta ha sido deshabilitada.');
      default:
        throw new Error(error.message || 'Error al enviar email de verificación');
    }
  }
};

// Check email verification status
export const checkEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }
    
    // Reload user to get latest verification status
    await reload(user);
    
    // Get real user data from Firestore
    console.log('🔄 Fetching user data from Firestore after email verification check...');
    const firestoreUserData = await getOrCreateUserData(user);
    
    // Update user data with real Firestore data
    const updatedUser = {
      email: user.email,
      uid: user.uid,
      emailVerified: user.emailVerified,
      // Real data from Firestore (no hardcoded values!)
      storiesGenerated: firestoreUserData.storiesGenerated || 0,
      monthlyStoriesGenerated: firestoreUserData.monthlyStoriesGenerated || 0,
      subscriptionStatus: firestoreUserData.subscriptionStatus || 'free',
      isPremium: firestoreUserData.isPremium || false,
      isAdmin: firestoreUserData.isAdmin || false,
      lastMonthReset: firestoreUserData.lastMonthReset,
      createdAt: firestoreUserData.createdAt,
      updatedAt: firestoreUserData.updatedAt
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update cache
    userCache = {
      data: updatedUser,
      timestamp: Date.now()
    };
    
    console.log('🔄 Email verification status updated with real Firestore data:', {
      emailVerified: user.emailVerified,
      storiesGenerated: updatedUser.storiesGenerated,
      subscriptionStatus: updatedUser.subscriptionStatus
    });
    
    return {
      emailVerified: user.emailVerified,
      user: updatedUser
    };
  } catch (error) {
    console.error('❌ Error checking email verification:', error);
    throw new Error('Error al verificar el estado del email');
  }
};

// Handle email verification from URL (when user clicks email link)
export const handleEmailVerification = async (actionCode) => {
  try {
    console.log('🔍 Handling email verification with action code');
    
    // Apply the email verification code
    await applyActionCode(auth, actionCode);
    
    // Reload the user to get updated verification status
    if (auth.currentUser) {
      await reload(auth.currentUser);
      
      // Update user data in localStorage
      const user = {
        email: auth.currentUser.email,
        uid: auth.currentUser.uid,
        emailVerified: auth.currentUser.emailVerified,
        subscriptionStatus: 'free',
        storiesGenerated: 0
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update cache
      userCache = {
        data: user,
        timestamp: Date.now()
      };
      
      console.log('✅ Email verification successful');
      
      return {
        success: true,
        message: '¡Email verificado exitosamente!',
        user: user
      };
    }
    
    return {
      success: true,
      message: '¡Email verificado exitosamente! Ya puedes iniciar sesión.'
    };
  } catch (error) {
    console.error('❌ Email verification error:', error);
    
    switch (error.code) {
      case 'auth/expired-action-code':
        throw new Error('El enlace de verificación ha expirado. Solicita uno nuevo.');
      case 'auth/invalid-action-code':
        throw new Error('Enlace de verificación inválido.');
      case 'auth/user-disabled':
        throw new Error('Esta cuenta ha sido deshabilitada.');
      default:
        throw new Error(error.message || 'Error al verificar el email');
    }
  }
};

// Helper function to update user data after story generation
export const updateUserStoriesCount = async (newStoriesGenerated, newMonthlyStoriesGenerated) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('No authenticated user to update');
      return null;
    }

    // Get current cached user data
    let userData = userCache.data;
    if (!userData) {
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        userData = JSON.parse(cachedUser);
      }
    }

    if (!userData) {
      console.warn('No user data found to update');
      return null;
    }

    // Update user data with new counts
    const updatedUser = {
      ...userData,
      storiesGenerated: newStoriesGenerated,
      monthlyStoriesGenerated: newMonthlyStoriesGenerated,
      updatedAt: new Date()
    };

    // Update cache
    userCache = {
      data: updatedUser,
      timestamp: Date.now()
    };

    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));

    console.log('✅ User stories count updated locally:', {
      storiesGenerated: newStoriesGenerated,
      monthlyStoriesGenerated: newMonthlyStoriesGenerated
    });

    return updatedUser;
  } catch (error) {
    console.error('Error updating user stories count:', error);
    return null;
  }
}; 