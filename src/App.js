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
import GoogleTagManager from './components/GoogleTagManager';
import config from './config';

// Usar configuración dinámica en lugar de URL hardcodeada
const API_URL = config.apiUrl;

function App() {
  console.log('🚀🚀🚀 [APP] APLICACIÓN INICIANDO - App.js está funcionando');
  console.log('🚀🚀🚀 [APP] Environment check:', {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: API_URL,
    isProduction: config.isProduction,
    timestamp: new Date().toISOString()
  });
  
  useEffect(() => {
    console.log('🚀🚀🚀 [APP] App useEffect ejecutándose - initProxy');
    initProxy();
    return () => {
      cleanupProxy();
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <AuthProvider>
          <CookieConsentProvider>
            <Router>
              <div id="google-signin-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }} />
              <GoogleTagManager />
              <AppRoutes />
              <CookieConsent />
            </Router>
          </CookieConsentProvider>
        </AuthProvider>
      </HelmetProvider>
    </I18nextProvider>
  );
}

export default App;