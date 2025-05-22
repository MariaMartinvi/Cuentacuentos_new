// Detectar si estamos en un entorno móvil (Capacitor)
const isMobile = window.Capacitor !== undefined;
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '10.0.2.2';

// Forzar el uso de 10.0.2.2 en el emulador
const config = {
  apiUrl: isProduction
    ? 'https://api.micuentacuentos.com'
    : isMobile
      ? 'http://10.0.2.2:5001'  // URL específica para el emulador de Android
      : 'http://localhost:5001',
  isMobile,
  isProduction
};

console.log('Config - Is mobile:', isMobile);
console.log('Config - Current hostname:', window.location.hostname);
console.log('Config - Is production:', isProduction);
console.log('Config - Using API URL:', config.apiUrl);

export default config; 