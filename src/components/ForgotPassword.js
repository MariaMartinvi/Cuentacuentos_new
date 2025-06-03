import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../services/authService';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage(t('forgotPassword.emailRequired'));
      setIsSuccess(false);
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const response = await forgotPassword(email);
      
      if (response.success) {
        setIsSuccess(true);
        setMessage(response.message);
      } else {
        throw new Error(response.message || t('forgotPassword.recoveryError'));
      }
    } catch (error) {
      console.error('Error in forgot password:', error);
      setIsSuccess(false);
      setMessage(error.message || t('forgotPassword.requestError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="logo-section">
            <h1>🎭 {t('appName')}</h1>
            <p>{t('forgotPassword.title')}</p>
          </div>
          
          <div className="forgot-password-content">
            {!isSuccess ? (
              <>
                <div className="header-section">
                  <div className="icon">🔐</div>
                  <h2>{t('forgotPassword.heading')}</h2>
                  <p>{t('forgotPassword.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="forgot-password-form">
                  <div className="form-group">
                    <label htmlFor="email">{t('forgotPassword.emailLabel')}</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('forgotPassword.emailPlaceholder')}
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
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-small"></span>
                        {t('forgotPassword.sending')}
                      </>
                    ) : (
                      t('forgotPassword.submitButton')
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="success-content">
                <div className="success-icon">📧</div>
                <h2>{t('forgotPassword.emailSent')}</h2>
                <p>{message}</p>
                
                <div className="info-box">
                  <h3>{t('forgotPassword.nextSteps')}</h3>
                  <ul>
                    <li>{t('forgotPassword.checkInbox')}</li>
                    <li>{t('forgotPassword.checkSpam')}</li>
                    <li>{t('forgotPassword.clickLink')}</li>
                    <li>{t('forgotPassword.createPassword')}</li>
                  </ul>
                </div>

                <div className="resend-section">
                  <p>{t('forgotPassword.noEmail')}</p>
                  <button 
                    onClick={() => {
                      setIsSuccess(false);
                      setMessage('');
                    }}
                    className="btn btn-outline"
                  >
                    {t('forgotPassword.tryAgain')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="footer-section">
            <p>
              {t('forgotPassword.rememberPassword')}{' '}
              <Link to="/login" className="link">
                {t('forgotPassword.login')}
              </Link>
            </p>
            <p>
              {t('forgotPassword.noAccount')}{' '}
              <Link to="/register" className="link">
                {t('forgotPassword.register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 