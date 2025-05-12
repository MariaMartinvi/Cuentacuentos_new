import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import { useTranslation } from 'react-i18next';
import '../styles/footer.css';

function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>{t('footer.title')}</h3>
            <p>{t('footer.description')}</p>
            <div className="footer-logo">
              <svg width="32" height="32" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="80" height="80" rx="16" fill="#4361ee"/>
                <path d="M20 25H60M20 40H60M20 55H40" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="50" cy="55" r="5" fill="white"/>
              </svg>
            </div>
          </div>

          <div className="footer-section">
            <h3>{t('footer.quickLinks')}</h3>
            <ul className="footer-links">
              <li><Link to="/como-funciona" onClick={scrollToTop}>{t('footer.howItWorks')}</Link></li>
              <li><Link to="/about" onClick={scrollToTop}>{t('footer.aboutUs')}</Link></li>
              <li><Link to="/terminos" onClick={scrollToTop}>{t('footer.terms')}</Link></li>
              <li><Link to="/politica" onClick={scrollToTop}>{t('footer.privacy')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="centered-text">© {currentYear} {t('footer.copyright')}</p>
          <div className="made-with">
            {t('footer.madeWith')} <span className="heart">❤️</span> {t('footer.inBarcelona')}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;