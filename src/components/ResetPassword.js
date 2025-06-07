import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPassword, verifyPasswordResetCode } from '../services/authService';
import './ResetPassword.css';

const ResetPassword = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [actionCode, setActionCode] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oobCode = params.get('oobCode'); // Firebase uses oobCode
    
    if (oobCode) {
      setActionCode(oobCode);
      verifyResetCode(oobCode);
    } else {
      setVerifying(false);
      setMessage(t('resetPassword.linkInvalid'));
    }
  }, [location, t]);

  const verifyResetCode = async (code) => {
    try {
      const result = await verifyPasswordResetCode(code);
      if (result.success) {
        setEmail(result.email);
        setVerifying(false);
      }
    } catch (error) {
      console.error('Error verifying reset code:', error);
      setVerifying(false);
      setMessage(error.message);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Muy débil', color: '#ef4444' };
      case 2: return { text: 'Débil', color: '#f97316' };
      case 3: return { text: 'Regular', color: '#eab308' };
      case 4: return { text: 'Fuerte', color: '#22c55e' };
      case 5: return { text: 'Muy fuerte', color: '#16a34a' };
      default: return { text: '', color: '#gray' };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const isPasswordValid = (password) => {
    return password.length >= 8 && 
           /[a-z]/.test(password) && 
           /[A-Z]/.test(password) && 
           /\d/.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!actionCode) {
      setMessage(t('resetPassword.linkInvalid'));
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setMessage(t('validation.allFieldsRequired'));
      return;
    }

    if (!isPasswordValid(formData.newPassword)) {
      setMessage(t('validation.passwordRequirements'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage(t('validation.passwordsDontMatch'));
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const response = await resetPassword(actionCode, formData.newPassword);
      
      if (response.success) {
        setIsSuccess(true);
        setMessage(response.message);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: t('resetPassword.successMessage'),
              type: 'success' 
            }
          });
        }, 3000);
      } else {
        throw new Error(response.message || t('messages.passwordResetError'));
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage(error.message || t('messages.passwordResetError'));
    } finally {
      setLoading(false);
    }
  };

  const strengthInfo = getPasswordStrengthText(passwordStrength);

  if (verifying) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="logo-section">
              <h1>🎭 {t('appName')}</h1>
            </div>
            <div className="reset-password-content">
              <div className="loading-content">
                <div className="spinner"></div>
                <h2>{t('resetPassword.verifying') || 'Verificando enlace...'}</h2>
                <p>{t('resetPassword.pleaseWait') || 'Por favor espera'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!actionCode || message) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="logo-section">
              <h1>🎭 {t('appName')}</h1>
            </div>
            <div className="reset-password-content">
              <div className="error-content">
                <div className="error-icon">❌</div>
                <h2>{t('resetPassword.linkExpired')}</h2>
                <p>{message}</p>
                <button 
                  onClick={() => navigate('/forgot-password')}
                  className="btn btn-primary"
                >
                  {t('resetPassword.requestNew')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="logo-section">
            <h1>🎭 {t('appName')}</h1>
            <p>{t('resetPassword.title')}</p>
          </div>
          
          <div className="reset-password-content">
            {!isSuccess ? (
              <>
                <div className="header-section">
                  <div className="icon">🔑</div>
                  <h2>{t('resetPassword.heading')}</h2>
                  <p>{t('resetPassword.subtitle')}</p>
                  {email && (
                    <p className="email-info">
                      📧 {email}
                    </p>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="reset-password-form">
                  <div className="form-group">
                    <label htmlFor="newPassword">{t('resetPassword.newPasswordLabel')}</label>
                    <div className="password-input-container">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder={t('resetPassword.newPasswordPlaceholder') || 'Ingresa tu nueva contraseña'}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    
                    {formData.newPassword && (
                      <div className="password-strength">
                        <div className="strength-bar">
                          <div 
                            className={`strength-fill strength-${passwordStrength}`}
                            style={{ width: `${(passwordStrength / 5) * 100}%`, backgroundColor: strengthInfo.color }}
                          ></div>
                        </div>
                        <span className="strength-text" style={{ color: strengthInfo.color }}>
                          {strengthInfo.text}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">{t('resetPassword.confirmPasswordLabel')}</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={t('resetPassword.confirmPasswordPlaceholder') || 'Confirma tu nueva contraseña'}
                      required
                      disabled={loading}
                    />
                  </div>

                  {message && (
                    <div className={`message ${isSuccess ? 'success' : 'error'}`}>
                      {message}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || passwordStrength < 3}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-small"></span>
                        {t('resetPassword.updating')}
                      </>
                    ) : (
                      t('resetPassword.submitButton')
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="success-content">
                <div className="success-icon">✅</div>
                <h2>{t('resetPassword.success')}</h2>
                <p>{message}</p>
                
                <div className="info-box">
                  <p>{t('resetPassword.successMessage')}</p>
                </div>

                <button 
                  onClick={() => navigate('/login')}
                  className="btn btn-primary"
                >
                  {t('resetPassword.goToLogin')}
                </button>
              </div>
            )}
          </div>

          <div className="footer-section">
            <p>
              ¿Recordaste tu contraseña? {' '}
              <button 
                onClick={() => navigate('/login')}
                className="link-button"
              >
                Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 