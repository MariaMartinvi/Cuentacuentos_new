// Vamos a actualizar la configuración con opciones explícitas para CORS
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, collection, getDocs, limit, query } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator, ref, getDownloadURL } from "firebase/storage";

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: "AIzaSyBDyWnyjvbATMRUzQFDk-pRndkKZKREw9o",
  authDomain: "cuentacuentos-b2e64.firebaseapp.com",
  projectId: "cuentacuentos-b2e64",
  storageBucket: "cuentacuentos-b2e64.firebasestorage.app",
  messagingSenderId: "8183103149",
  appId: "1:8183103149:web:7e57b742d64996bd78d024"
};

console.log('🔥 Firebase Config (hardcoded for testing):', firebaseConfig);

// Debug: Log configuration to check if variables are loaded
console.log('🔥 Firebase Config Debug:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
  appId: process.env.REACT_APP_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'
});

// Verificar que las variables de entorno estén definidas
const checkEnvVariables = () => {
  // Temporarily disabled for hardcoded testing
  return true;
  
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`Firebase disabled: Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  return true;
};

// Verificar variables de entorno
const isFirebaseConfigured = checkEnvVariables();

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Error initializing Firebase:", error);
  throw error; // Re-throw to prevent app from running with broken Firebase
}

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});

// Configure Auth
auth.useDeviceLanguage();
auth.settings.appVerificationDisabledForTesting = false;

// Configuración específica para producción en Render
if (process.env.NODE_ENV === 'production') {
  console.log('🌐 Production mode detected, configuring for Render deployment');
  
  // Configurar dominios autorizados para Firebase Auth
  const currentDomain = window.location.hostname;
  console.log('🌐 Current domain:', currentDomain);
  
  // Lista de dominios autorizados (agregar tu dominio de Render aquí)
  const authorizedDomains = [
    'localhost',
    'audiogretel.com',
    'www.audiogretel.com',
    'cuentacuentos-b2e64.firebaseapp.com',
    // Agregar tu dominio de Render aquí cuando lo sepas
    // 'tu-app.onrender.com'
  ];
  
  if (!authorizedDomains.some(domain => currentDomain.includes(domain))) {
    console.warn('⚠️ Current domain not in authorized list. Add to Firebase Console:', currentDomain);
  }
  
  // Configuración específica para evitar errores COOP
  try {
    // Deshabilitar persistencia en producción si causa problemas
    console.log('🔧 Configuring Firebase for production environment');
    
    // Configuración adicional para evitar problemas COOP
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('Cross-Origin-Opener-Policy') ||
           event.reason.message.includes('postMessage'))) {
        console.debug('🔇 COOP/postMessage error suppressed:', event.reason.message);
        event.preventDefault(); // Prevenir que el error se propague
      }
    });

    // También capturar errores de consola relacionados con COOP
    window.addEventListener('error', (event) => {
      if (event.message && 
          (event.message.includes('Cross-Origin-Opener-Policy') ||
           event.message.includes('postMessage'))) {
        console.debug('🔇 COOP/postMessage console error suppressed:', event.message);
        event.preventDefault();
      }
    });
    
  } catch (error) {
    console.warn('⚠️ Error in production Firebase config:', error);
  }
}

// Configurar timeouts y reintentos
const MAX_RETRIES = 2;
const TIMEOUT_DURATION = 480000; // 8 minutos para uploads grandes (publicación)

// Función para manejar reintentos
const withRetry = async (operation, retries = MAX_RETRIES) => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase not configured');
  }
  
  try {
    return await operation();
  } catch (error) {
    console.error("Operation failed:", error);
    
    if (retries > 0) {
      console.log(`Reintentando operación. Intentos restantes: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
};

// Función para manejar timeouts
const withTimeout = (promise, duration = TIMEOUT_DURATION) => {
  if (!isFirebaseConfigured) {
    return Promise.reject(new Error('Firebase not configured'));
  }
  
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${duration}ms`));
    }, duration);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Función para obtener una URL pública de Storage con manejo de errores mejorado
const getPublicUrl = async (path) => {
  if (!isFirebaseConfigured || !storage) {
    throw new Error('Firebase Storage not configured');
  }
  
  try {
    // Decodificar la ruta si está codificada
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(path);
    } catch (e) {
      console.warn('Error decoding path, using original:', e);
      decodedPath = path;
    }
    
    console.log('Getting public URL for path:', decodedPath);
    
    // Crear referencia al archivo
    const storageRef = ref(storage, decodedPath);
    
    // Intentar obtener la URL directamente
    console.log('Attempting to get download URL for:', decodedPath);
    const url = await getDownloadURL(storageRef);
    console.log('Successfully got URL:', url);
    return url;
  } catch (error) {
    console.error('Error in getPublicUrl:', error);
    throw error;
  }
};

// Verificar la conexión con Firebase
const checkFirebaseConnection = async () => {
  if (!isFirebaseConfigured || !db) {
    console.log('Firebase not configured, skipping connection check');
    return false;
  }
  
  try {
    // Intentar una operación simple de Firestore usando la sintaxis modular
    const storyExamplesRef = collection(db, 'storyExamples');
    const q = query(storyExamplesRef, limit(1));
    await getDocs(q);
    console.log('Firebase connection successful');
    return true;
  } catch (error) {
    console.error('Firebase connection error:', error);
    return false;
  }
};

// Verificar la conexión al iniciar solo si Firebase está configurado
if (isFirebaseConfigured) {
  checkFirebaseConnection();
}

export { 
  db, 
  auth, 
  storage, 
  withRetry, 
  withTimeout,
  getPublicUrl,
  checkFirebaseConnection,
  isFirebaseConfigured
}; 