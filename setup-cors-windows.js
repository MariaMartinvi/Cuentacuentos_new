/**
 * Script para configurar CORS en Firebase Storage usando la API REST
 * Esta versión no requiere gsutil y funciona en Windows
 * 
 * Uso:
 * 1. Asegúrate de tener Node.js instalado
 * 2. Ejecuta: node setup-cors-windows.js
 */

const fs = require('fs');
const https = require('https');
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Crear archivo de configuración CORS
const createCorsFile = () => {
  const corsConfig = [
    {
      "origin": ["*"],
      "method": ["GET", "HEAD", "OPTIONS"],
      "maxAgeSeconds": 3600,
      "responseHeader": ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"]
    }
  ];

  fs.writeFileSync('cors.json', JSON.stringify(corsConfig, null, 2));
  console.log('✅ Archivo cors.json creado');
  return corsConfig;
};

// Obtener un token de Firebase CLI
const getFirebaseToken = () => {
  return new Promise((resolve, reject) => {
    console.log('🔑 Obteniendo token de autenticación...');
    
    // Intentar iniciar sesión con Firebase CLI
    exec('firebase login:ci --no-localhost', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error al obtener token:', error);
        console.log('⚠️ Intentando método alternativo...');
        
        // Si falla, pedir token manualmente
        rl.question('Por favor, abre https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk y genera una clave privada.\nLuego, ingresa el token aquí: ', (token) => {
          if (!token) {
            reject(new Error('No se proporcionó un token'));
            return;
          }
          resolve(token);
        });
      } else {
        // Extraer token de la salida
        const match = stdout.match(/(?:Use this token to login:|1\| )([^\s]+)/);
        if (match && match[1]) {
          resolve(match[1]);
        } else {
          reject(new Error('No se pudo extraer el token de la salida'));
        }
      }
    });
  });
};

// Configurar CORS usando la API REST de Firebase
const configureCorsWithRest = async (projectId, corsConfig) => {
  try {
    console.log(`🔧 Configurando CORS para el proyecto ${projectId}...`);
    
    // Abre el navegador para que el usuario configure CORS manualmente
    const url = `https://console.firebase.google.com/project/${projectId}/storage`;
    console.log(`\n⚠️ La configuración automática no está disponible en Windows sin gsutil.`);
    console.log(`\n✅ Sigue estos pasos para configurar CORS manualmente:\n`);
    console.log(`1. Abre esta URL en tu navegador:`);
    console.log(`   ${url}`);
    console.log(`2. Ve a la pestaña "Rules" (Reglas)`);
    console.log(`3. Añade la siguiente configuración CORS:`);
    console.log(`\n   cors = [${JSON.stringify(corsConfig[0], null, 2)}];\n`);
    console.log(`4. Haz clic en "Publicar"`);
    
    // Abrir el navegador automáticamente
    exec(`start ${url}`, (error) => {
      if (error) {
        console.error('❌ Error al abrir el navegador:', error);
        console.log(`Por favor, abre manualmente la URL: ${url}`);
      }
    });
    
    // Preguntar al usuario si completó la configuración
    rl.question('\n¿Has completado la configuración CORS? (s/n): ', (answer) => {
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si' || answer.toLowerCase() === 'sí' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('✅ ¡Configuración CORS completada!');
      } else {
        console.log('⚠️ Por favor, completa la configuración CORS manualmente.');
      }
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ Error al configurar CORS:', error);
    rl.close();
  }
};

// Función principal
const main = async () => {
  console.log('🔥 Configuración de CORS para Firebase Storage 🔥');
  console.log('Este script te ayudará a configurar CORS para tu bucket de Firebase Storage.');
  
  rl.question('Ingresa el ID de tu proyecto Firebase (ej: "cuentacuentos-b2e64"): ', async (projectId) => {
    if (!projectId) {
      console.error('❌ El ID del proyecto es obligatorio');
      rl.close();
      return;
    }
    
    const corsConfig = createCorsFile();
    await configureCorsWithRest(projectId, corsConfig);
  });
};

// Ejecutar el script
main(); 