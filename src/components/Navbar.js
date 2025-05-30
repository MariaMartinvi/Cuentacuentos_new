import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Debug user data
  useEffect(() => {
    if (user) {
      console.log('🔍 User data in Navbar:', user);
      console.log('📸 User photoURL:', user.photoURL);
      console.log('👤 User name:', user.name);
      console.log('📧 User email:', user.email);
    }
  }, [user]);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const handleMobileMenuClick = (callback) => {
    if (callback) callback();
    setIsMobileMenuOpen(false);
    scrollToTop();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setIsLanguageDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <div className="navbar-left">
          <div className="logo">
            <Link to="/" onClick={scrollToTop}>
              <img src="/logo192.png" alt="AudioGretel Logo" className="logo-image" />
              <span className="logo-text">AudioGretel</span>
            </Link>
          </div>

          {/* Mobile menu toggle - moved next to logo */}
          <div className="mobile-menu-toggle" ref={mobileMenuRef}>
            <button
              className={`hamburger-button ${isMobileMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            
            {/* Mobile dropdown menu */}
            {isMobileMenuOpen && (
              <div className="mobile-dropdown">
                {user ? (
                  <div className="mobile-user-section">
                    <div className="mobile-user-info">
                      <div className="mobile-avatar">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.name || user.email}
                            className="mobile-avatar-image"
                          />
                        ) : (
                          <div className="mobile-avatar-placeholder">
                            <span className="mobile-avatar-initial">
                              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {user.isPremium && (
                          <div className="mobile-premium-indicator">⭐</div>
                        )}
                      </div>
                      <div className="mobile-user-details">
                        <div className="mobile-user-name">
                          {user.name || user.email}
                        </div>
                        {user.isPremium && (
                          <div className="mobile-premium-badge">⭐ Premium</div>
                        )}
                      </div>
                    </div>
                    {!user.isPremium && (
                      <Link 
                        to="/subscribe" 
                        className="mobile-subscribe-link"
                        onClick={() => handleMobileMenuClick()}
                      >
                        {t('subscription.subscribeButton')}
                      </Link>
                    )}
                    <Link 
                      to="/profile" 
                      className="mobile-menu-item profile-item"
                      onClick={() => handleMobileMenuClick()}
                    >
                      {t('navbar.profile')}
                    </Link>
                    <button 
                      className="mobile-menu-item mobile-logout"
                      onClick={handleLogout}
                    >
                      {t('navbar.logout')}
                    </button>
                  </div>
                ) : (
                  <div className="mobile-auth-section">
                    <Link 
                      to="/login" 
                      className="mobile-login-button"
                      onClick={() => handleMobileMenuClick()}
                    >
                      {t('navbar.login')}
                    </Link>
                    <Link 
                      to="/register" 
                      className="mobile-register-link"
                      onClick={() => handleMobileMenuClick()}
                    >
                      {t('navbar.register')}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="nav-right">
          {/* Desktop navigation */}
          <div className="nav-links desktop-only">
            {user ? (
              <div className="user-section">
                {!user.isPremium && (
                  <Link to="/subscribe" className="subscribe-link" onClick={scrollToTop}>
                    {t('subscription.subscribeButton')}
                  </Link>
                )}
                <div className="user-avatar-container" ref={userDropdownRef}>
                  <button 
                    className="user-avatar-button"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  >
                    <div className="user-avatar">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.name || user.email}
                          className="avatar-image"
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          <span className="avatar-initial">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {user.isPremium && (
                        <div className="premium-indicator">⭐</div>
                      )}
                    </div>
                  </button>
                  {isUserDropdownOpen && (
                    <div className="user-dropdown">
                      <div className="user-info">
                        <div className="user-name-dropdown">
                          {user.name || user.email}
                        </div>
                        {user.isPremium && (
                          <div className="premium-badge-dropdown">⭐ Premium</div>
                        )}
                      </div>
                      <hr className="dropdown-divider" />
                      <Link 
                        to="/profile" 
                        className="dropdown-item profile-item"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          scrollToTop();
                        }}
                      >
                        {t('navbar.profile')}
                      </Link>
                      <button 
                        className="dropdown-item logout-item"
                        onClick={handleLogout}
                      >
                        {t('navbar.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="login-nav-button" onClick={scrollToTop}>{t('navbar.login')}</Link>
                <Link to="/register" className="register-nav-link" onClick={scrollToTop}>{t('navbar.register')}</Link>
              </>
            )}
          </div>
          
          {/* Language selector - always visible */}
          <div className="language-selector" ref={languageDropdownRef}>
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
      </div>
    </nav>
  );
}

export default Navbar;