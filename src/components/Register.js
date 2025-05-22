import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';
import SEO from './SEO';
import { GoogleLogin } from '@react-oauth/google';

// Determinar la URL correcta basada en el entorno
const isProduction = window.location.hostname !== 'localhost';
const isEmulator = window.Capacitor;

// Usar 10.0.2.2 para el emulador Android
const API_URL = isEmulator 
  ? 'http://10.0.2.2:5001'
  : isProduction 
    ? 'https://generadorcuentos.onrender.com'
    : 'http://localhost:5001';

console.log('Register component - Using API URL:', API_URL, 'isEmulator:', isEmulator, 'hostname:', window.location.hostname);

const Register = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login: setAuthContext } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        if(response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        await setAuthContext(response.data.token, response.data.user);
        setSuccess(t('register.success'));
        navigate('/');
      } else {
        throw new Error ('Invalid response from registration server');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.details || err.response?.data?.message || t('register.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterSuccess = async (credentialResponse) => {
    setError('');
    setSuccess('');
    setLoading(true); 
    console.log("Google Credential Response (Register):", credentialResponse);
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
        await setAuthContext(backendResponse.data.token, backendResponse.data.user); 
        setSuccess(t('register.successGoogle')); 
        navigate('/');
      } else {
        throw new Error('Invalid response from backend Google sign-in');
      }
    } catch (err) {
      console.error('Backend Google sign-in error (Register):', err.response?.data?.details || err.message);
      setError(err.response?.data?.details || err.message || t('register.googleError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterError = () => {
    console.error('Google Sign-In Failed (Register)');
    setError(t('register.googleError'));
  };

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

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="google-register-section" style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleRegisterSuccess}
            onError={handleGoogleRegisterError}
            useOneTap
          />
        </div>

        <div className="divider">
          <span>{t('register.or')}</span>
        </div>
        
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
          {t('register.alreadyAccount')} <a href="/login">{t('register.login')}</a>
        </p>
      </div>
    </div>
  );
};

export default Register; 