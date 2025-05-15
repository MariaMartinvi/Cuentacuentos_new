/**
 * Script para verificar que los archivos existen en Firebase Storage
 * 
 * Uso:
 * 1. Asegúrate de tener Node.js instalado
 * 2. Ejecuta: node verify-files.js
 */

// Importar Firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, getMetadata, getBytes } = require('firebase/storage');
// Importar dotenv para cargar variables de entorno
require('dotenv').config();

// Verificar que las variables de entorno estén definidas
const requiredVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file and ensure all required variables are defined.');
  process.exit(1);
}

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Archivos a verificar
const filesToCheck = [
  'stories/dragon-no-volar.txt',
  'stories/dragon-share.txt',
  'audio/dragon-no-volar.mp3',
  'audio/dragon-share.mp3'
];

// Función para verificar un archivo
async function checkFile(path) {
  console.log(`\nVerificando archivo: ${path}`);
  
  try {
    // Crear referencia al archivo
    const fileRef = ref(storage, path);
    console.log('✓ Referencia creada');
    
    // Intentar obtener metadatos
    try {
      const metadata = await getMetadata(fileRef);
      console.log('✓ Metadatos obtenidos:');
      console.log(`  - Tipo: ${metadata.contentType}`);
      console.log(`  - Tamaño: ${metadata.size} bytes`);
      console.log(`  - Ruta completa: ${metadata.fullPath}`);
      console.log(`  - Bucket: ${metadata.bucket}`);
      
      // Intentar obtener contenido
      try {
        const bytes = await getBytes(fileRef);
        console.log(`✓ Contenido obtenido: ${bytes.length} bytes`);
        
        if (path.endsWith('.txt')) {
          const content = new TextDecoder().decode(bytes);
          console.log(`✓ Vista previa: ${content.substring(0, 100)}...`);
        }
        
        return { exists: true, hasContent: true, metadata };
      } catch (contentError) {
        console.error(`✗ Error obteniendo contenido: ${contentError.message}`);
        return { exists: true, hasContent: false, metadata };
      }
    } catch (metadataError) {
      console.error(`✗ Error obteniendo metadatos: ${metadataError.message}`);
      return { exists: false, error: metadataError };
    }
  } catch (error) {
    console.error(`✗ Error general: ${error.message}`);
    return { exists: false, error };
  }
}

// Función principal
async function main() {
  console.log('=== VERIFICACIÓN DE ARCHIVOS EN FIREBASE STORAGE ===');
  console.log(`Bucket: ${process.env.REACT_APP_FIREBASE_STORAGE_BUCKET}`);
  console.log(`Verificando ${filesToCheck.length} archivos...`);
  
  const results = {};
  
  for (const file of filesToCheck) {
    results[file] = await checkFile(file);
  }
  
  console.log('\n=== RESUMEN ===');
  for (const [file, result] of Object.entries(results)) {
    if (result.exists && result.hasContent) {
      console.log(`✓ ${file}: OK (${result.metadata.size} bytes)`);
    } else if (result.exists) {
      console.log(`⚠ ${file}: Existe pero no se pudo obtener contenido`);
    } else {
      console.log(`✗ ${file}: No existe`);
    }
  }
}

// Ejecutar script
main().catch(error => {
  console.error('Error ejecutando script:', error);
}); 