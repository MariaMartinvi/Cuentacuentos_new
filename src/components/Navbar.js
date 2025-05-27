import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    setIsLanguageDropdownOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const languages = [
    { code: 'en', name: t('navbar.languages.en') },
    { code: 'es', name: t('navbar.languages.es') },
    { code: 'ca', name: t('navbar.languages.ca') },
    { code: 'fr', name: t('navbar.languages.fr') },
    { code: 'it', name: t('navbar.languages.it') },
    { code: 'de', name: t('navbar.languages.de') },
    { code: 'gl', name: t('navbar.languages.gl') },
    { code: 'eu', name: t('navbar.languages.eu') },
    { code: 'pt', name: t('navbar.languages.pt') }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <Link to="/" onClick={scrollToTop}>
            <span className="emoji">🌙</span>
            <span>AudioGretel</span>
          </Link>
        </div>
        <div className="nav-links">
          <Link to="/" onClick={scrollToTop}>{t('navbar.home')}</Link>
          <Link to="/contact" onClick={scrollToTop}>{t('navbar.contact')}</Link>
        </div>
        <div className="nav-links">
          {user ? (
            <>
              <Link 
                to="/profile" 
                className={`user-name ${user.isPremium ? 'premium-user' : ''}`} 
                onClick={scrollToTop}
              >
                {user.name || user.email}
                {user.isPremium && (
                  <span className="premium-badge">⭐ Premium</span>
                )}
              </Link>
              {!user.isPremium && (
                <Link to="/subscribe" className="subscribe-link" onClick={scrollToTop}>
                  {t('subscription.subscribeButton')}
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="login-nav-button" onClick={scrollToTop}>{t('navbar.login')}</Link>
              <Link to="/register" className="register-nav-link" onClick={scrollToTop}>{t('navbar.register')}</Link>
            </>
          )}
        </div>
        <div className="language-selector">
          <button
            className="language-button"
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          >
            {t(`navbar.languages.${i18n.language}`)}
          </button>
          {isLanguageDropdownOpen && (
            <div className="language-dropdown">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={i18n.language === lang.code ? 'active-language' : ''}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;