import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEO from '../SEO';

const HowToGeneratePage = () => {
  const { t, i18n } = useTranslation();

  return (
    <>
      <SEO
        title={t('howToPage.seoTitle')}
        description={t('howToPage.seoDescription')}
        keywords={t('howToPage.seoKeywords', { returnObjects: true })}
        canonicalUrl="https://audiogretel.com/como-generar-audiocuentos-ia"
        lang={i18n.language}
      />

      <div className="tools-page">
        <div className="tools-hero">
          <div className="container">
            <h1 className="tools-title">
              {t('howToPage.title')}
            </h1>
            <p className="tools-subtitle">
              {t('howToPage.subtitle')}
            </p>
          </div>
        </div>

        <div className="container">
          <section className="tool-features">
            <h2>{t('howToPage.whatAre')}</h2>
            <p style={{fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '3rem', textAlign: 'center'}}>
              {t('howToPage.whatAreDescription')}
            </p>
            
            <h2>{t('howToPage.stepByStep')}</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📝</div>
                <h3>{t('howToPage.step1Title')}</h3>
                <p>{t('howToPage.step1Description')}</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">⚙️</div>
                <h3>{t('howToPage.step2Title')}</h3>
                <p>{t('howToPage.step2Description')}</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <h3>{t('howToPage.step3Title')}</h3>
                <p>{t('howToPage.step3Description')}</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🎵</div>
                <h3>{t('howToPage.step4Title')}</h3>
                <p>{t('howToPage.step4Description')}</p>
              </div>
            </div>
          </section>

          <section className="cta-section">
            <div className="cta-content">
              <h2>{t('howToPage.ctaTitle')}</h2>
              <p>{t('howToPage.ctaDescription')}</p>
              <Link to="/" className="cta-button">
                {t('howToPage.ctaButton')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default HowToGeneratePage; 