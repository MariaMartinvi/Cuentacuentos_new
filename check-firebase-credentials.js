/**
 * Script para verificar las credenciales de Firebase
 * 
 * Este script verifica si existe el archivo firebase-credentials.json
 * y crea un archivo de plantilla si no existe.
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo de credenciales
const credentialsPath = path.join(__dirname, 'firebase-credentials.json');

// Plantilla de credenciales
const credentialsTemplate = {
  "type": "service_account",
  "project_id": "cuentacuentos-b2e64",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "YOUR_PRIVATE_KEY",
  "client_email": "YOUR_CLIENT_EMAIL",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "YOUR_CLIENT_CERT_URL",
  "universe_domain": "googleapis.com"
};

// Verificar si existe el archivo de credenciales
if (fs.existsSync(credentialsPath)) {
  console.log('✅ El archivo de credenciales de Firebase existe.');
  console.log(`   Ruta: ${credentialsPath}`);
  
  try {
    // Intentar leer el archivo para verificar que es un JSON válido
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    // Verificar campos mínimos requeridos
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ El archivo de credenciales parece válido.');
      console.log(`   Proyecto: ${credentials.project_id}`);
      console.log(`   Cliente: ${credentials.client_email}`);
    } else {
      console.log('⚠️ El archivo de credenciales existe pero faltan campos importantes:');
      missingFields.forEach(field => console.log(`   - Falta: ${field}`));
    }
  } catch (error) {
    console.error('❌ Error al leer el archivo de credenciales:', error.message);
  }
} else {
  console.log('⚠️ No se encontró el archivo de credenciales de Firebase.');
  console.log('   Creando archivo de plantilla...');
  
  try {
    fs.writeFileSync(credentialsPath, JSON.stringify(credentialsTemplate, null, 2));
    console.log('✅ Se ha creado un archivo de plantilla de credenciales.');
    console.log(`   Ruta: ${credentialsPath}`);
    console.log('\n⚠️ IMPORTANTE: Este es solo un archivo de plantilla.');
    console.log('   Debes reemplazar los valores con tus propias credenciales de Firebase.');
    console.log('\n📝 Pasos para obtener credenciales reales:');
    console.log('   1. Ve a https://console.firebase.google.com/');
    console.log('   2. Selecciona tu proyecto "cuentacuentos-b2e64"');
    console.log('   3. Ve a Configuración > Cuentas de servicio');
    console.log('   4. Haz clic en "Generar nueva clave privada"');
    console.log('   5. Guarda el archivo JSON descargado como "firebase-credentials.json" en la raíz del proyecto');
  } catch (error) {
    console.error('❌ Error al crear el archivo de plantilla:', error.message);
  }
}

// Verificar la configuración de Firebase en el script de subida
const uploadScriptPath = path.join(__dirname, 'firebase-upload-assets.js');

if (fs.existsSync(uploadScriptPath)) {
  console.log('\nVerificando script de subida...');
  
  try {
    const scriptContent = fs.readFileSync(uploadScriptPath, 'utf8');
    
    // Verificar si el script contiene la configuración de Firebase
    if (scriptContent.includes('apiKey') && scriptContent.includes('storageBucket')) {
      console.log('✅ El script de subida contiene la configuración de Firebase.');
    } else {
      console.log('⚠️ El script de subida no parece contener la configuración completa de Firebase.');
    }
  } catch (error) {
    console.error('❌ Error al verificar el script de subida:', error.message);
  }
} else {
  console.log('\n⚠️ No se encontró el script de subida "firebase-upload-assets.js".');
} 