/**
 * Script para subir archivos de historias, imágenes y audios a Firebase Storage usando Admin SDK
 * 
 * Uso:
 * 1. Asegúrate de tener el archivo firebase-credentials.json en la raíz del proyecto
 * 2. Ejecuta: node firebase-upload-admin.js
 * 
 * Puedes especificar directorios personalizados con argumentos:
 * node firebase-upload-admin.js --stories=./mis-historias --images=./mis-imagenes --audio=./mis-audios
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ruta al archivo de credenciales
const credentialsPath = path.join(__dirname, 'firebase-credentials.json');

// Verificar si existe el archivo de credenciales
if (!fs.existsSync(credentialsPath)) {
  console.error('❌ No se encontró el archivo de credenciales de Firebase.');
  console.error('Por favor, crea un archivo firebase-credentials.json con las credenciales de tu cuenta de servicio de Firebase.');
  process.exit(1);
}

// Leer el archivo de credenciales
let serviceAccount;
try {
  serviceAccount = require(credentialsPath);
  console.log(`✅ Credenciales cargadas para el proyecto: ${serviceAccount.project_id}`);
} catch (error) {
  console.error('❌ Error al leer el archivo de credenciales:', error.message);
  process.exit(1);
}

// Inicializar Firebase Admin con las credenciales
try {
  // Usar el nombre específico del bucket de la configuración original
  const bucketName = "cuentacuentos-b2e64.firebasestorage.app";
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: bucketName
  });
  
  console.log(`✅ Firebase Admin inicializado correctamente con el bucket: ${bucketName}`);
} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin:', error.message);
  process.exit(1);
}

// Obtener referencia al bucket
const bucket = admin.storage().bucket();

// Extensiones de archivo permitidas por categoría
const allowedExtensions = {
  stories: ['.txt', '.md', '.json'],
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a']
};

// Función para parsear argumentos de línea de comandos
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value;
    }
  });
  return args;
}

// Directorios por defecto y personalizados
const args = parseArgs();
const directories = {
  stories: args.stories || './temp/stories',
  images: args.images || './temp/images',
  audio: args.audio || './temp/audio'
};

// Función para verificar si un directorio existe
function directoryExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// Función para listar archivos en un directorio con filtro de extensión
function listFiles(dirPath, allowedExts) {
  if (!directoryExists(dirPath)) {
    console.log(`⚠️ El directorio ${dirPath} no existe o no es accesible`);
    return [];
  }
  
  try {
    return fs.readdirSync(dirPath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return allowedExts.includes(ext);
      })
      .map(file => ({
        filename: file,
        path: path.join(dirPath, file),
        ext: path.extname(file).toLowerCase(),
        size: fs.statSync(path.join(dirPath, file)).size
      }));
  } catch (err) {
    console.error(`❌ Error al listar archivos en ${dirPath}:`, err.message);
    return [];
  }
}

// Función para determinar el tipo de contenido basado en la extensión
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  const contentTypes = {
    // Texto
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    
    // Imágenes
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/m4a'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

// Función para subir un archivo a Firebase Storage usando Admin SDK
async function uploadFile(filePath, destinationPath) {
  try {
    const contentType = getContentType(filePath);
    
    // Opciones para la subida
    const options = {
      destination: destinationPath,
      metadata: {
        contentType: contentType,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4()
        }
      }
    };
    
    console.log(`  Subiendo a bucket: ${bucket.name}`);
    
    // Subir el archivo
    const [file] = await bucket.upload(filePath, options);
    
    // Obtener URL pública
    const [metadata] = await file.getMetadata();
    const downloadToken = metadata.metadata.firebaseStorageDownloadTokens;
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;
    
    return {
      success: true,
      path: destinationPath,
      url: downloadURL,
      size: fs.statSync(filePath).size
    };
  } catch (error) {
    console.error(`❌ Error al subir archivo ${filePath}:`, error.message);
    return {
      success: false,
      path: destinationPath,
      error: error.message
    };
  }
}

// Función principal para subir todos los archivos
async function uploadAllFiles() {
  console.log('=== SUBIENDO ARCHIVOS A FIREBASE STORAGE ===\n');
  
  const results = {
    stories: [],
    images: [],
    audio: []
  };
  
  // Procesar historias
  console.log('📚 Procesando historias...');
  const storyFiles = listFiles(directories.stories, allowedExtensions.stories);
  
  if (storyFiles.length > 0) {
    console.log(`Encontrados ${storyFiles.length} archivos de historias para subir`);
    
    for (const file of storyFiles) {
      console.log(`- Subiendo historia: ${file.filename} (${(file.size / 1024).toFixed(2)} KB)`);
      const result = await uploadFile(
        file.path, 
        `stories/${file.filename}`
      );
      
      results.stories.push({
        filename: file.filename,
        ...result
      });
      
      if (result.success) {
        console.log(`  ✅ Subido correctamente a ${result.path}`);
        console.log(`  📎 URL: ${result.url}`);
      } else {
        console.log(`  ❌ Error: ${result.error}`);
      }
    }
  } else {
    console.log('No se encontraron archivos de historias para subir');
  }
  
  // Procesar imágenes
  console.log('\n🖼️ Procesando imágenes...');
  const imageFiles = listFiles(directories.images, allowedExtensions.images);
  
  if (imageFiles.length > 0) {
    console.log(`Encontrados ${imageFiles.length} archivos de imágenes para subir`);
    
    for (const file of imageFiles) {
      console.log(`- Subiendo imagen: ${file.filename} (${(file.size / 1024).toFixed(2)} KB)`);
      const result = await uploadFile(
        file.path, 
        `images/${file.filename}`
      );
      
      results.images.push({
        filename: file.filename,
        ...result
      });
      
      if (result.success) {
        console.log(`  ✅ Subido correctamente a ${result.path}`);
        console.log(`  📎 URL: ${result.url}`);
      } else {
        console.log(`  ❌ Error: ${result.error}`);
      }
    }
  } else {
    console.log('No se encontraron archivos de imágenes para subir');
  }
  
  // Procesar audios
  console.log('\n🔊 Procesando archivos de audio...');
  const audioFiles = listFiles(directories.audio, allowedExtensions.audio);
  
  if (audioFiles.length > 0) {
    console.log(`Encontrados ${audioFiles.length} archivos de audio para subir`);
    
    for (const file of audioFiles) {
      console.log(`- Subiendo audio: ${file.filename} (${(file.size / 1024).toFixed(2)} KB)`);
      const result = await uploadFile(
        file.path, 
        `audio/${file.filename}`
      );
      
      results.audio.push({
        filename: file.filename,
        ...result
      });
      
      if (result.success) {
        console.log(`  ✅ Subido correctamente a ${result.path}`);
        console.log(`  📎 URL: ${result.url}`);
      } else {
        console.log(`  ❌ Error: ${result.error}`);
      }
    }
  } else {
    console.log('No se encontraron archivos de audio para subir');
  }
  
  // Resumen final
  console.log('\n=== RESUMEN DE LA SUBIDA ===');
  console.log(`📚 Historias: ${results.stories.filter(r => r.success).length} subidas, ${results.stories.filter(r => !r.success).length} fallidas`);
  console.log(`🖼️ Imágenes: ${results.images.filter(r => r.success).length} subidas, ${results.images.filter(r => !r.success).length} fallidas`);
  console.log(`🔊 Audios: ${results.audio.filter(r => r.success).length} subidos, ${results.audio.filter(r => !r.success).length} fallidos`);
  
  // Generar archivo JSON con los resultados
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultFilePath = `upload-results-${timestamp}.json`;
  
  fs.writeFileSync(resultFilePath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Resultados guardados en ${resultFilePath}`);
  
  return results;
}

// Verificar que los directorios existan
console.log('Verificando directorios...');
Object.entries(directories).forEach(([key, dir]) => {
  if (directoryExists(dir)) {
    console.log(`✅ Directorio ${key}: ${dir}`);
  } else {
    console.log(`⚠️ Directorio ${key} no encontrado: ${dir}`);
  }
});

// Ejecutar la función principal
console.log('\nIniciando proceso de subida...');
uploadAllFiles()
  .then(() => {
    console.log('\n✅ Proceso completado');
  })
  .catch(error => {
    console.error('\n❌ Error general:', error);
    process.exit(1);
  }); 