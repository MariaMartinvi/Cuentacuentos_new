/**
 * Script para verificar y corregir problemas de CORS en Firebase Storage
 * 
 * Uso:
 * 1. Asegúrate de tener Node.js instalado
 * 2. Ejecuta: node cors-fix.js
 * 3. Para forzar la aplicación de CORS: node cors-fix.js --apply-cors
 */

// Importar Firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, getMetadata, getBytes } = require('firebase/storage');
const { exec } = require('child_process');
const fs = require('fs');

// Cargar variables de entorno
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

// Verificar argumentos de línea de comandos
const shouldApplyCors = process.argv.includes('--apply-cors');

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
        return { exists: true, hasContent: false, metadata, error: contentError };
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

// Función para generar archivo de configuración CORS
function generateCorsConfig() {
  const corsConfig = [
    {
      "origin": ["*"],
      "method": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "DELETE"],
      "responseHeader": ["Content-Type", "Content-Length", "Content-Range", "Content-Disposition", "Access-Control-Allow-Origin"],
      "maxAgeSeconds": 3600
    }
  ];
  
  fs.writeFileSync('cors.json', JSON.stringify(corsConfig, null, 2));
  console.log('✓ Archivo cors.json generado');
  
  return 'cors.json';
}

// Función para aplicar configuración CORS
function applyCorsConfig(bucketName, configFile) {
  console.log(`\nAplicando configuración CORS al bucket: ${bucketName}`);
  
  return new Promise((resolve, reject) => {
    // Comando para aplicar configuración CORS usando gsutil
    const command = `gsutil cors set ${configFile} gs://${bucketName}`;
    
    console.log(`Ejecutando: ${command}`);
    console.log('NOTA: Este comando requiere que tengas instalado y configurado Google Cloud SDK');
    console.log('Si no lo tienes, puedes aplicar la configuración manualmente desde la consola de Firebase');
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`✗ Error aplicando configuración CORS: ${error.message}`);
        console.log('Puedes aplicar la configuración manualmente:');
        console.log('1. Ve a la consola de Firebase: https://console.firebase.google.com');
        console.log(`2. Selecciona tu proyecto: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
        console.log('3. Ve a Storage > Rules');
        console.log('4. Agrega la siguiente configuración CORS:');
        console.log(fs.readFileSync('cors.json', 'utf8'));
        reject(error);
        return;
      }
      
      console.log('✓ Configuración CORS aplicada correctamente');
      console.log(stdout);
      
      if (stderr) {
        console.warn('Advertencias:', stderr);
      }
      
      resolve();
    });
  });
}

// Función principal
async function main() {
  console.log('=== VERIFICACIÓN Y CORRECCIÓN DE CORS EN FIREBASE STORAGE ===');
  console.log(`Bucket: ${process.env.REACT_APP_FIREBASE_STORAGE_BUCKET}`);
  console.log(`Verificando ${filesToCheck.length} archivos...`);
  
  const results = {};
  let corsIssuesDetected = false;
  
  for (const file of filesToCheck) {
    results[file] = await checkFile(file);
    
    // Detectar posibles problemas de CORS
    if (results[file].error && 
        (results[file].error.message.includes('CORS') || 
         results[file].error.message.includes('network') ||
         results[file].error.message.includes('permission'))) {
      corsIssuesDetected = true;
    }
  }
  
  console.log('\n=== RESUMEN ===');
  for (const [file, result] of Object.entries(results)) {
    if (result.exists && result.hasContent) {
      console.log(`✓ ${file}: OK (${result.metadata.size} bytes)`);
    } else if (result.exists) {
      console.log(`⚠ ${file}: Existe pero no se pudo obtener contenido`);
      if (result.error) {
        console.log(`  Error: ${result.error.message}`);
      }
    } else {
      console.log(`✗ ${file}: No existe`);
      if (result.error) {
        console.log(`  Error: ${result.error.message}`);
      }
    }
  }
  
  // Si se detectaron problemas de CORS o se fuerza la aplicación, ofrecer solución
  if (corsIssuesDetected || shouldApplyCors) {
    console.log('\n=== ' + (corsIssuesDetected ? 'POSIBLES PROBLEMAS DE CORS DETECTADOS' : 'APLICANDO CONFIGURACIÓN CORS FORZADA') + ' ===');
    console.log('Se generará un archivo de configuración CORS y se intentará aplicarlo');
    
    const configFile = generateCorsConfig();
    
    try {
      await applyCorsConfig(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, configFile);
      console.log('\n✓ Configuración CORS aplicada. Intenta recargar la aplicación.');
    } catch (error) {
      console.error('\n✗ No se pudo aplicar la configuración automáticamente.');
      console.log('Por favor, aplica la configuración manualmente siguiendo las instrucciones anteriores.');
    }
  } else {
    console.log('\n✓ No se detectaron problemas de CORS evidentes.');
    console.log('Si aún tienes problemas, ejecuta este script con la opción --apply-cors para forzar la configuración CORS.');
  }
}

// Ejecutar script
main().catch(error => {
  console.error('Error ejecutando script:', error);
}); 