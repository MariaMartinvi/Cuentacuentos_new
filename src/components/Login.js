import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login, loginWithGoogle } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';
import SEO from './SEO';

// Determinar la URL correcta basada en el entorno
const isProduction = window.location.hostname !== 'localhost';
const API_URL = isProduction 
  ? 'https://generadorcuentos.onrender.com'
  : 'http://localhost:5001';

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingTime, setLoadingTime] = useState(0);
  
  // Simulate checking connection to backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle case when returning from Google auth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuthInProgress = sessionStorage.getItem('googleAuthInProgress');
    
    if (googleAuthInProgress) {
      // We've returned from somewhere, clear the flag
      sessionStorage.removeItem('googleAuthInProgress');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    setError('');
    setLoading(true);

    try {
      console.log('Calling login function...');
      const response = await login(formData.email, formData.password);
      console.log('Login response received:', response);

      if (response && response.token) {
        console.log('Token received, checking localStorage...');
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        console.log('Token in localStorage:', token ? 'Exists' : 'Not found');
        console.log('User in localStorage:', user ? 'Exists' : 'Not found');

        console.log('Refreshing user context...');
        await refreshUser();
        console.log('Navigation to home...');
        navigate('/');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      setLoadingMessage(t('login.connectingServer'));
      setLoadingTime(0);
      
      // Set a flag in sessionStorage to know we started Google auth
      sessionStorage.setItem('googleAuthInProgress', 'true');
      
      // Start a timer to update loading message
      const timer = setInterval(() => {
        setLoadingTime(prev => {
          const newTime = prev + 1;
          if (newTime === 3) {
            setLoadingMessage(t('login.wakingUpServer'));
          } else if (newTime === 7) {
            setLoadingMessage(t('login.preparingRedirect'));
          } else if (newTime >= 10) {
            setLoadingMessage(t('login.redirectingToGoogle'));
          }
          return newTime;
        });
      }, 1000);
      
      // Hacer múltiples pings para despertar el servidor más rápido
      const pingServer = async () => {
        for (let i = 0; i < 3; i++) {
          try {
            console.log(`Ping intento ${i+1}...`);
            await fetch(`${API_URL}/test`, { 
              method: 'GET',
              mode: 'no-cors',
              cache: 'no-store',
              // Deshabilitar el timeout para evitar que la solicitud se aborte
              signal: AbortSignal.timeout(10000) // 10 segundos de timeout
            });
            console.log(`Ping ${i+1} exitoso`);
            // Si el ping es exitoso, podemos continuar
            break;
          } catch (e) {
            console.log(`Ping ${i+1} falló, pero continuando...`);
            // Esperar un poco antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      };

      // Iniciar el ping de manera asíncrona, sin esperar a que termine
      pingServer().catch(e => console.log('Error en pingServer:', e));
      
      const frontendUrl = window.location.origin;
      // Usar un timeout para asegurar que la superposición se muestre antes de redirigir
      // Aumentar el timeout si la pantalla de carga ocurre muy rápido
      setTimeout(() => {
        clearInterval(timer);
        window.location.href = `${API_URL}/api/auth/google?redirect_uri=${encodeURIComponent(frontendUrl)}`;
      }, 800);
      
    } catch (error) {
      console.error('Google login error:', error);
      setGoogleLoading(false);
      setError(t('login.error'));
    }
  };

  if (initialLoading) {
    return (
      <div className="login-container">
        <SEO 
          title={i18n.language === 'es' ? 
            'Iniciar Sesión - Mi Cuentacuentos' : 
            'Login - My Storyteller'}
          description={i18n.language === 'es' ? 
            'Inicia sesión en Mi Cuentacuentos para acceder a todas las funciones de generación de cuentos personalizados.' : 
            'Log in to My Storyteller to access all the personalized story generation features.'}
          keywords={['iniciar sesión', 'login', 'acceso', 'cuenta de usuario']}
          lang={i18n.language}
        />
        <div className="login-card">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>{t('login.connecting')}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (googleLoading) {
    return (
      <div className="fullscreen-overlay">
        <SEO 
          title={i18n.language === 'es' ? 
            'Iniciar Sesión con Google - Mi Cuentacuentos' : 
            'Login with Google - My Storyteller'}
          description={i18n.language === 'es' ? 
            'Iniciando sesión con Google en Mi Cuentacuentos.' : 
            'Logging in with Google to My Storyteller.'}
          keywords={['iniciar sesión', 'login', 'google', 'autenticación']}
          lang={i18n.language}
        />
        <div className="google-loading-container">
          <div className="google-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </div>
          <div className="spinner"></div>
          <p>{loadingMessage}</p>
          {loadingTime >= 5 && (
            <p className="loading-time">{t('login.timeElapsed', { seconds: loadingTime })}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <SEO 
        title={i18n.language === 'es' ? 
          'Iniciar Sesión - Mi Cuentacuentos' : 
          'Login - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Inicia sesión en Mi Cuentacuentos para acceder a todas las funciones de generación de cuentos personalizados.' : 
          'Log in to My Storyteller to access all the personalized story generation features.'}
        keywords={['iniciar sesión', 'login', 'acceso', 'cuenta de usuario']}
        lang={i18n.language}
      />
      <div className="login-card">
        <h1 className="login-title">{t('login.title')}</h1>
        <p className="login-subtitle">{t('login.subtitle')}</p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          className="google-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner small-spinner"></div>
              {t('login.loading')}
            </>
          ) : (
            <>
              <img src="/google-icon.svg" alt="Google" />
              {t('login.signInWithGoogle')}
            </>
          )}
        </button>

        <div className="divider">
          <span>{t('login.or')}</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">{t('login.emailLabel')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('login.emailPlaceholder')}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('login.passwordLabel')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('login.passwordPlaceholder')}
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? t('login.loading') : t('login.loginButton')}
          </button>
        </form>

        <p className="register-link">
          {t('login.noAccount')} <Link to="/register">{t('login.register')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 