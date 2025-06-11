import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { register } from '../services/authService';
import './Register.css';
import SEO from './SEO';
import config from '../config';
import GoogleButton from './GoogleButton';

// Use API URL from config
const API_URL = config.apiUrl;

console.log('Register component - Using API URL:', API_URL);

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
  const [registrationComplete, setRegistrationComplete] = useState(false);

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

    // Basic password validation
    if (formData.password.length < 6) {
      setError(t('register.passwordValidation'));
      setLoading(false);
      return;
    }

    try {
      const response = await register(formData.email, formData.password);

      // Registration was successful
      setRegistrationComplete(true);
      setSuccess(response.message || '¡Registro exitoso! Por favor verifica tu email antes de iniciar sesión.');
      
      // Do NOT set auth context - user must verify email first
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || t('register.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterSuccess = async (credentialResponse) => {
    setError('');
    setSuccess('');
    setLoading(true); 
    console.log("Google Credential Response (Register):", credentialResponse);
    
    try {
      // Import Firebase Auth functions
      const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
      const { auth } = await import('../firebase/config');
      
      // Create Firebase credential from Google token
      const credential = GoogleAuthProvider.credential(credentialResponse.credential);
      
      // Sign in to Firebase with Google credential
      const result = await signInWithCredential(auth, credential);
      const firebaseUser = result.user;
      
      console.log('✅ Firebase Google Auth successful (Register):', firebaseUser.email);
      
      // Get Firebase ID token (this is what the backend expects)
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Create user data
      const userData = {
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        name: firebaseUser.displayName,
        picture: firebaseUser.photoURL,
        uid: firebaseUser.uid,
        subscriptionStatus: 'free',
        storiesGenerated: 0
      };
      
      // Store Firebase token (not Google token)
      localStorage.setItem('token', firebaseToken);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Google register - User data saved:', userData);
      
      // Set auth context with Firebase token
      await setAuthContext(firebaseToken, userData);
      setSuccess(t('register.successGoogle')); 
      navigate('/');
      
    } catch (err) {
      console.error('Firebase Google register error:', err);
      setError(err.message || t('register.googleError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterError = () => {
    console.error('Google Sign-In Failed (Register)');
    setError(t('register.googleError'));
  };

  if (registrationComplete) {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="success-content">
            <div className="success-icon">📧</div>
            <h2>¡Registro exitoso!</h2>
            <p className="success-message">{success}</p>
            
            <div className="info-box">
              <h3>Verifica tu email para activar tu cuenta</h3>
              <p>Revisa tu bandeja de entrada (y spam) y haz clic en el enlace de verificación.</p>
              
              <div className="important-note">
                <strong>📍 Importante:</strong> No podrás crear cuentos hasta verificar tu email.
              </div>
            </div>

            <div className="action-buttons">
              <Link to="/login" className="btn btn-primary">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <SEO 
        title={i18n.language === 'es' ? 
          'Registro - AudioGretel' : 
          'Register - AudioGretel'}
        description={i18n.language === 'es' ? 
          'Crea una cuenta en AudioGretel y comienza a generar cuentos personalizados para niños. Regístrate gratis y obtén cuentos de prueba.' : 
          'Create an account on AudioGretel and start generating personalized stories for children. Register for free and get trial stories.'}
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
        {success && !registrationComplete && <div className="success-message">{success}</div>}
        
        <div className="google-login-section">
          <GoogleButton
            onSuccess={handleGoogleRegisterSuccess}
            onError={handleGoogleRegisterError}
            useOneTap={false}
            type="register"
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
            <div className="password-hint">
              <small>{t('register.passwordValidation')}</small>
            </div>
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
          {t('register.alreadyAccount')} <Link to="/login">{t('register.login')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register; 