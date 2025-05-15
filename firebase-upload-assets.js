/**
 * Script para subir archivos de historias, imágenes y audios a Firebase Storage
 * 
 * Uso:
 * 1. Asegúrate de tener el archivo firebase-credentials.json en la raíz del proyecto
 * 2. Ejecuta: node firebase-upload-assets.js
 * 
 * Puedes especificar directorios personalizados con argumentos:
 * node firebase-upload-assets.js --stories=./mis-historias --images=./mis-imagenes --audio=./mis-audios
 */

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCHwFteCQ32331TdD_Euit74bcO_JMRS9U",
  authDomain: "cuentacuentos-b2e64.firebaseapp.com",
  projectId: "cuentacuentos-b2e64",
  storageBucket: "cuentacuentos-b2e64.firebasestorage.app",
  messagingSenderId: "8183103149",
  appId: "1:8183103149:web:7e57b742d64996bd78d024",
  measurementId: "G-0B04JP0PPF"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

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

// Función para subir un archivo a Firebase Storage
async function uploadFile(filePath, destinationPath, contentType) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const storageRef = ref(storage, destinationPath);
    
    const metadata = {
      contentType: contentType || getContentType(filePath)
    };
    
    const result = await uploadBytes(storageRef, fileBuffer, metadata);
    const downloadURL = await getDownloadURL(result.ref);
    
    return {
      success: true,
      path: destinationPath,
      url: downloadURL,
      size: fileBuffer.length
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