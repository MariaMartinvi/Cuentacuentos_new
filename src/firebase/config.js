// Vamos a actualizar la configuración con opciones explícitas para CORS
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, collection, getDocs, limit, query } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator, ref, getDownloadURL } from "firebase/storage";

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Verificar que las variables de entorno estén definidas
const checkEnvVariables = () => {
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

// Inicializar Firebase solo si está configurado
let app, db, auth, storage;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    
    // Configurar Firestore con opciones personalizadas
    db = getFirestore(app);
    
    // Habilitar persistencia offline para Firestore
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence.');
      }
    });
    
    // Configurar Auth con opciones personalizadas
    auth = getAuth(app);
    auth.useDeviceLanguage();
    auth.settings.appVerificationDisabledForTesting = false;
    
    // Configurar Storage con opciones personalizadas
    storage = getStorage(app);
    
    console.log("Firebase configurado correctamente");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.log("Firebase not initialized - missing configuration");
  // Crear objetos mock para evitar errores
  db = null;
  auth = null;
  storage = null;
}

// Configurar timeouts y reintentos
const MAX_RETRIES = 2;
const TIMEOUT_DURATION = 10000; // 10 segundos

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