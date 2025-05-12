import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';
import SEO from './SEO';

// Determinar la URL correcta basada en el entorno
const isProduction = window.location.hostname !== 'localhost';
const API_URL = isProduction 
  ? 'https://generadorcuentos.onrender.com'
  : 'http://localhost:5001';

// Hacemos el ping al servidor de forma anticipada para despertarlo antes de que el usuario interactúe
const wakeUpServer = async () => {
  try {
    fetch(`${API_URL}/test`, { 
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000) // Reducido a 5 segundos para no bloquear
    });
  } catch (e) {
    // Silenciamos errores para evitar registros en consola
  }
};

// Iniciamos el ping inmediatamente al cargar el componente
wakeUpServer();

const Register = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Handle case when returning from Google auth
  useEffect(() => {
    const googleAuthInProgress = sessionStorage.getItem('googleAuthInProgress');
    
    if (googleAuthInProgress) {
      sessionStorage.removeItem('googleAuthInProgress');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordsDontMatch'));
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        await login(response.data.token);
        setSuccess(t('register.success'));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || t('register.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      setLoadingMessage(t('register.redirectingToGoogle'));
      
      // Set a flag in sessionStorage to know we started Google auth
      sessionStorage.setItem('googleAuthInProgress', 'true');
      
      // Iniciar el ping inmediatamente y redirigir sin delays
      fetch(`${API_URL}/test`, { 
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store'
      }).catch(() => {/* ignorar errores */});
      
      const frontendUrl = window.location.origin;
      // Prácticamente instant redirect (200ms para que se muestre visual feedback)
      setTimeout(() => {
        window.location.href = `${API_URL}/api/auth/google?redirect_uri=${encodeURIComponent(frontendUrl)}`;
      }, 200);
      
    } catch (error) {
      setGoogleLoading(false);
      setError(t('register.error'));
    }
  };

  if (googleLoading) {
    return (
      <div className="fullscreen-overlay">
        <SEO 
          title={i18n.language === 'es' ? 
            'Registro con Google - Mi Cuentacuentos' : 
            'Register with Google - My Storyteller'}
          description={i18n.language === 'es' ? 
            'Registrándote con Google en Mi Cuentacuentos.' : 
            'Registering with Google to My Storyteller.'}
          keywords={['registro', 'register', 'google', 'autenticación']}
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
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <SEO 
        title={i18n.language === 'es' ? 
          'Registro - Mi Cuentacuentos' : 
          'Register - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Crea una cuenta en Mi Cuentacuentos y comienza a generar cuentos personalizados para niños. Regístrate gratis y obtén cuentos de prueba.' : 
          'Create an account on My Storyteller and start generating personalized stories for children. Register for free and get trial stories.'}
        keywords={['registro', 'crear cuenta', 'sign up', 'cuenta gratis', 'cuentos personalizados']}
        lang={i18n.language}
      />
      
      <div className="register-card">
        <h1 className="register-title">{t('register.title')}</h1>
        <p className="register-subtitle">{t('register.subtitle')}</p>
        
        <div className="free-stories-banner">
          <div className="free-stories-icon">🎁</div>
          <div className="free-stories-text">
            <p className="free-stories-title">{t('register.freeStories')}</p>
            <p className="free-stories-subtitle">{t('register.subscribeLater')}</p>
          </div>
        </div>

        <button 
          className="google-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner small-spinner"></div>
              {t('register.loading')}
            </>
          ) : (
            <>
              <img src="/google-icon.svg" alt="Google" />
              {t('register.signInWithGoogle')}
            </>
          )}
        </button>

        <div className="divider">
          <span>{t('register.or')}</span>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="email">{t('register.emailLabel')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('register.emailPlaceholder')}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('register.passwordLabel')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('register.passwordPlaceholder')}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('register.confirmPasswordLabel')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t('register.confirmPasswordPlaceholder')}
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner small-spinner"></div>
                {t('register.loading')}
              </>
            ) : (
              t('register.createAccount')
            )}
          </button>
        </form>

        <p className="login-link">
          {t('register.loginLink')}
        </p>
      </div>
    </div>
  );
};

export default Register; 