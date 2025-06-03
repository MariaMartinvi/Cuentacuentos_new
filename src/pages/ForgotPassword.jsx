import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(t('messages.forgotPasswordError'));
    }
    setLoading(false);
  };

  return (
    <main className="main-content">
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <div className="forgot-password-card">
            <div className="logo-section">
              <h1>🎭 {t('appName')}</h1>
              <p>{t('forgotPassword.title')}</p>
            </div>
            <div className="forgot-password-content">
              <div className="header-section">
                <div className="icon">🔐</div>
                <h2>{t('forgotPassword.heading')}</h2>
                <p>{t('forgotPassword.subtitle')}</p>
              </div>
              <form className="forgot-password-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">{t('forgotPassword.emailLabel')}</label>
                  <input
                    type="email"
                    id="email"
                    placeholder={t('forgotPassword.emailPlaceholder')}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{t('messages.forgotPasswordSuccess')}</div>}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? t('forgotPassword.sending') : t('forgotPassword.submitButton')}
                </button>
              </form>
            </div>
            <div className="footer-section">
              <p>
                {t('forgotPassword.rememberPassword')}{' '}
                <a className="link" href="/login">
                  {t('forgotPassword.login')}
                </a>
              </p>
              <p>
                {t('forgotPassword.noAccount')}{' '}
                <a className="link" href="/register">
                  {t('forgotPassword.register')}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword; 