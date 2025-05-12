import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useCookieConsent } from '../contexts/CookieConsentContext';
import './CookieConsent.css';

const CookieConsent = () => {
  const { t } = useTranslation();
  const { showBanner, giveConsent, rejectConsent } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <div className="cookie-consent-container">
      <div className="cookie-consent-content">
        <div className="cookie-icon">🍪</div>
        <div className="cookie-text">
          <h3>{t('cookies.title')}</h3>
          <p>{t('cookies.description')}</p>
        </div>
        <div className="cookie-buttons">
          <button 
            className="cookie-accept-btn" 
            onClick={giveConsent}
            aria-label={t('cookies.accept')}
          >
            {t('cookies.accept')}
          </button>
          <button 
            className="cookie-reject-btn" 
            onClick={rejectConsent}
            aria-label={t('cookies.reject')}
          >
            {t('cookies.reject')}
          </button>
          <Link 
            to="/politica" 
            className="cookie-more-info"
            aria-label={t('cookies.moreInfo')}
          >
            {t('cookies.moreInfo')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent; 