import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { GoogleOAuthProvider } from '@react-oauth/google';

// const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
// console.log('Google Client ID for Provider:', googleClientId); 

const DUMMY_CLIENT_ID = "YOUR_CLIENT_ID_IS_NOT_LOADING_OR_IS_INVALID_FALLBACK.apps.googleusercontent.com";
console.log('Using DUMMY_CLIENT_ID for GoogleOAuthProvider:', DUMMY_CLIENT_ID);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={DUMMY_CLIENT_ID}> {/* Using dummy ID for test */}
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
