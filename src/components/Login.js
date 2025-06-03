import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';
import SEO from './SEO';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import config from '../config';
import GoogleButton from './GoogleButton';

// Use API URL from config
const API_URL = config.apiUrl;

console.log('Login component - Using API URL:', API_URL);

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
  const [initialLoading, setInitialLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(formData.email, formData.password);
      if (response && response.token) {
        await refreshUser();
        navigate('/');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    console.log("Google Credential Response:", credentialResponse);
    const idToken = credentialResponse.credential;

    try {
      const backendResponse = await axios.post(`${API_URL}/api/auth/google`, {
        idToken: idToken
      });

      if (backendResponse.data && backendResponse.data.token) {
        localStorage.setItem('token', backendResponse.data.token);
        if (backendResponse.data.user) {
          localStorage.setItem('user', JSON.stringify(backendResponse.data.user));
        }
        await refreshUser();
        navigate('/');
      } else {
        throw new Error('Invalid response from backend Google login');
      }
    } catch (err) {
      console.error('Backend Google login error:', err.response?.data?.details || err.message);
      setError(err.response?.data?.details || err.message || t('login.googleError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    console.error('Google Login Failed');
    setError(t('login.googleError'));
  };

  if (initialLoading) {
    return (
      <div className="login-container">
        <SEO 
          title={i18n.language === 'es' ? 
            'Iniciar Sesión - AudioGretel' : 
            'Login - AudioGretel'}
          description={i18n.language === 'es' ? 
            'Inicia sesión en AudioGretel para acceder a todas las funciones de generación de cuentos personalizados.' : 
            'Log in to AudioGretel to access all the personalized story generation features.'}
          keywords={['iniciar sesión', 'login', 'acceso', 'cuenta de usuario']}
          lang={i18n.language}
        />
        <div className="login-card">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>{i18n.language === 'es' ? 'Conectando...' : 'Connecting...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <SEO 
        title={i18n.language === 'es' ? 
          'Iniciar Sesión - AudioGretel' : 
          'Login - AudioGretel'}
        description={i18n.language === 'es' ? 
          'Inicia sesión en AudioGretel para acceder a todas las funciones de generación de cuentos personalizados.' : 
          'Log in to AudioGretel to access all the personalized story generation features.'}
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
        
        <div className="google-login-section">
          <GoogleButton
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            useOneTap
            type="login"
          />
        </div>

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

          <div className="forgot-password-link">
            <Link to="/forgot-password" className="forgot-link">
              {t('login.forgotPassword')}
            </Link>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner small-spinner"></div>
                {t('login.loading')}
              </>
            ) : (
              t('login.loginButton')
            )}
          </button>
        </form>

        <div className="auth-links">
          <p className="register-link">
            {t('login.noAccount')} <Link to="/register">{t('login.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 