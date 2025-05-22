import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import i18n from './i18n';
import { AuthProvider } from './contexts/AuthContext';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import AppRoutes from './routes';
import CookieConsent from './components/CookieConsent';
import { initProxy, cleanupProxy } from './services/proxyService';

// Use production server URL
const API_URL = 'https://generadorcuentos.onrender.com';

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
  
  // Inicializar el proxy para Firebase Storage
  useEffect(() => {
    console.log('Inicializando proxy para Firebase Storage...');
    initProxy().then(() => {
      console.log('Proxy para Firebase Storage inicializado correctamente');
    }).catch(error => {
      console.error('Error inicializando proxy para Firebase Storage:', error);
    });
    
    return () => {
      console.log('Limpiando proxy para Firebase Storage...');
      cleanupProxy();
    };
  }, []);

  return (
    <div className="App">
      {/* Add the proxy iframe with proper attributes */}
      <iframe
        id="proxy-frame"
        src="/proxy.html"
        style={{ display: 'none' }}
        title="Proxy Service"
        sandbox="allow-same-origin allow-scripts"
        referrerPolicy="no-referrer"
      />
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
    </div>
  );
}

export default App;