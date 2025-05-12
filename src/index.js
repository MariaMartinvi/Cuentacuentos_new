import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './styles/global.css';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n.js';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error('CRITICAL ERROR: REACT_APP_GOOGLE_CLIENT_ID is not defined. Google OAuth will not work.');
  // Optionally render an error message to the DOM here if you want to halt the app
  // For example: document.getElementById('root').innerHTML = 'Google Client ID is missing';
}

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
        <p>Por favor, asegúrese de que la variable de entorno REACT_APP_GOOGLE_CLIENT_ID esté configurada correctamente en su archivo .env.</p>
      </div>
    )}
  </React.StrictMode>
);
