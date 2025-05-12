import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import i18n from './i18n';
import { AuthProvider } from './contexts/AuthContext';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import AppRoutes from './routes';
import CookieConsent from './components/CookieConsent';

// Determinar la URL correcta basada en el entorno
const isProduction = window.location.hostname !== 'localhost';
const API_URL = isProduction 
  ? 'https://generadorcuentos.onrender.com'
  : 'http://localhost:5001';

function App() {
  
  // Pre-calentar el servidor de Render al cargar la aplicación
  useEffect(() => {
    const preWarmServer = async () => {
      try {
        console.log('Pre-calentando el servidor...');
        await fetch(`${API_URL}/test`, { 
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store'
        });
      } catch (e) {
        console.log('Error pre-calentando el servidor, pero continuando...');
      }
    };
    
    preWarmServer();
    
    // También establecer un intervalo para mantenerlo activo
    const keepWarmInterval = setInterval(() => {
      preWarmServer();
    }, 4 * 60 * 1000); // Cada 4 minutos
    
    return () => clearInterval(keepWarmInterval);
  }, []);

  return (
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <CookieConsentProvider>
            <Router>
              <AppRoutes />
              <CookieConsent />
            </Router>
          </CookieConsentProvider>
        </AuthProvider>
      </I18nextProvider>
    </HelmetProvider>
  );
}

export default App;