import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './ToolsPage.css';
import SEO from '../SEO';

const ToolsPage = () => {
  const { t, i18n } = useTranslation();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AudioGretel - Generador de Audiocuentos",
    "applicationCategory": "EducationalApplication",
    "description": "Herramienta de inteligencia artificial para generar audiocuentos personalizados para niños en múltiples idiomas",
    "url": "https://audiogretel.com/herramientas/generador-audiocuentos",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    },
    "author": {
      "@type": "Organization",
      "name": "AudioGretel"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    },
    "featureList": [
      "Generación de cuentos con IA",
      "Audio en múltiples idiomas",
      "Personalización por edad",
      "Diferentes voces y acentos",
      "Música de fondo opcional",
      "Descarga de audio",
      "Compartir historias"
    ]
  };

  return (
    <>
      <SEO
        title={t('toolsPage.seoTitle')}
        description={t('toolsPage.seoDescription')}
        keywords={t('toolsPage.seoKeywords', { returnObjects: true })}
        canonicalUrl="https://audiogretel.com/herramientas/generador-audiocuentos"
        lang={i18n.language}
      >
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </SEO>

      <div className="tools-page">
        <div className="tools-hero">
          <div className="container">
            <h1 className="tools-title">
              {t('toolsPage.title')}
            </h1>
            <p className="tools-subtitle">
              {t('toolsPage.subtitle')}
            </p>
            <div className="tools-badges">
              <span className="badge">🤖 {t('toolsPage.badge1')}</span>
              <span className="badge">🎯 {t('toolsPage.badge2')}</span>
              <span className="badge">🌍 {t('toolsPage.badge3')}</span>
              <span className="badge">🎵 {t('toolsPage.badge4')}</span>
              <span className="badge">🆓 {t('toolsPage.badge5')}</span>
            </div>
          </div>
        </div>

        <div className="container">
          <section className="tool-features">
            <h2>{t('toolsPage.whyBest')}</h2>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎨</div>
                <h3>{t('toolsPage.feature1Title')}</h3>
                <p>{t('toolsPage.feature1Description')}</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🗣️</div>
                <h3>{t('toolsPage.feature2Title')}</h3>
                <p>{t('toolsPage.feature2Description')}</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🎵</div>
                <h3>{t('toolsPage.feature3Title')}</h3>
                <p>{t('toolsPage.feature3Description')}</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">⚙️</div>
                <h3>{t('toolsPage.feature4Title')}</h3>
                <p>{t('toolsPage.feature4Description')}</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3>{t('toolsPage.feature5Title')}</h3>
                <p>{t('toolsPage.feature5Description')}</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">💾</div>
                <h3>{t('toolsPage.feature6Title')}</h3>
                <p>{t('toolsPage.feature6Description')}</p>
              </div>
            </div>
          </section>

          <section className="cta-section">
            <div className="cta-content">
              <h2>{t('toolsPage.ctaTitle')}</h2>
              <p>{t('toolsPage.ctaDescription')}</p>
              <Link to="/" className="cta-button">
                {t('toolsPage.ctaButton')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default ToolsPage; 