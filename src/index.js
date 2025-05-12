import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './styles/global.css';
import './i18n.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
