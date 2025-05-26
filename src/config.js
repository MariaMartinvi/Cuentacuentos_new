// Detectar si estamos en un entorno móvil (Capacitor)
const isMobile = window.Capacitor !== undefined;

// Configuración global
const config = {
  apiUrl: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5001'
    : 'https://generadorcuentos.onrender.com',
  isMobile: isMobile,
  isProduction: process.env.NODE_ENV === 'production'
};

console.log('Config - Is mobile:', isMobile);
console.log('Config - Current hostname:', window.location.hostname);
console.log('Config - Is production:', config.isProduction);
console.log('Config - Using API URL:', config.apiUrl);

export default config; 