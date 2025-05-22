// Detectar si estamos en un entorno móvil (Capacitor)
const isMobile = window.Capacitor !== undefined;

// Configuración global
const config = {
  apiUrl: 'https://generadorcuentos.onrender.com',
  isMobile: isMobile,
  isProduction: true
};

console.log('Config - Is mobile:', isMobile);
console.log('Config - Current hostname:', window.location.hostname);
console.log('Config - Is production:', config.isProduction);
console.log('Config - Using API URL:', config.apiUrl);

export default config; 