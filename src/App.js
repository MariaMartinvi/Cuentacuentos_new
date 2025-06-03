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
import { GoogleOAuthProvider } from '@react-oauth/google';
import config from './config';

// Use production server URL
const API_URL = 'https://generadorcuentos.onrender.com';

const GOOGLE_CLIENT_ID = '83367976748-itlu4htdt85qq5j1rrf58mo724dt629p.apps.googleusercontent.com';

function App() {
  useEffect(() => {
    initProxy();
    return () => {
      cleanupProxy();
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
        </GoogleOAuthProvider>
      </HelmetProvider>
    </I18nextProvider>
  );
}

export default App;