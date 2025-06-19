// Script de debugging para Firebase Auth
// Ejecutar en la consola del navegador en audiogretel.com

console.log('🔍 Firebase Auth Debugging Script');
console.log('================================');

// Información del dominio actual
console.log('📍 Domain Info:');
console.log('  - Hostname:', window.location.hostname);
console.log('  - Origin:', window.location.origin);
console.log('  - Protocol:', window.location.protocol);
console.log('  - User Agent:', navigator.userAgent.substring(0, 100) + '...');

// Verificar Firebase
try {
  console.log('\n🔥 Firebase Configuration:');
  
  // Importar Firebase
  import('./src/firebase/config.js').then(({ auth }) => {
    console.log('  - Firebase Auth Domain:', auth.app.options.authDomain);
    console.log('  - Firebase Project ID:', auth.app.options.projectId);
    console.log('  - Current User:', auth.currentUser?.email || 'None');
    
    // Verificar configuración de Google Auth
    console.log('\n🔧 Required Firebase Console Settings:');
    console.log('Go to: https://console.firebase.google.com/project/cuentacuentos-b2e64/authentication/settings');
    console.log('Add these domains to "Authorized domains":');
    console.log('  - audiogretel.com');
    console.log('  - www.audiogretel.com');
    
    // Test de conectividad
    console.log('\n🌐 Testing Firebase Connection...');
    auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user?.email || 'No user');
    });
    
  }).catch(err => {
    console.error('Error loading Firebase:', err);
  });
  
} catch (error) {
  console.error('Error in debugging script:', error);
}

// Verificar Google APIs
console.log('\n🔍 Checking Google APIs...');
if (window.google) {
  console.log('✅ Google APIs loaded');
} else {
  console.log('❌ Google APIs not loaded');
}

// Verificar headers de seguridad
console.log('\n🛡️ Security Headers Check:');
fetch(window.location.href, { method: 'HEAD' })
  .then(response => {
    console.log('Response headers:');
    for (let [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('cross-origin') || 
          key.toLowerCase().includes('content-security') ||
          key.toLowerCase().includes('same-origin')) {
        console.log(`  - ${key}: ${value}`);
      }
    }
  })
  .catch(err => console.log('Could not fetch headers:', err.message));

console.log('\n✅ Debugging script completed. Check the console for results.'); 