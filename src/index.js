import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './styles/global.css';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n.js';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Temporary hardcoded Google Client ID from Firebase configuration
// This should match the Web application client ID from Firebase Console
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "8183103149-2v0n7ugpiov4l90m2imb3su9e64vaghj.apps.googleusercontent.com";

console.log('🔑 Google Client ID configured:', googleClientId ? '✅ Set' : '❌ Missing');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </GoogleOAuthProvider>
    ) : (
      <div>
        <h1>Error de Configuración</h1>
        <p>La aplicación no se puede iniciar porque falta el ID de cliente de Google.</p>
        <p>Por favor, configure REACT_APP_GOOGLE_CLIENT_ID en su archivo .env</p>
      </div>
    )}
  </React.StrictMode>
);

// Register service worker for better caching and performance
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('[ServiceWorker] Content cached for offline use');
  },
  onUpdate: (registration) => {
    console.log('[ServiceWorker] New content available, reload to update');
    // Optionally show a notification to the user
  }
});
