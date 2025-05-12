import React from 'react';
import { useTranslation } from 'react-i18next';
import './PoliticaPage.css';
import SEO from '../SEO';

const PoliticaPage = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="politica-page">
      <SEO 
        title={i18n.language === 'es' ? 
          'Política de Privacidad - Mi Cuentacuentos' : 
          'Privacy Policy - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Política de privacidad de Mi Cuentacuentos. Información sobre cómo recopilamos, usamos y protegemos tus datos personales.' : 
          'Privacy policy of My Storyteller. Information about how we collect, use and protect your personal data.'}
        keywords={['política de privacidad', 'protección de datos', 'cookies', 'seguridad', 'derechos de usuario']}
        lang={i18n.language}
      />
      
      <div className="page-header">
        <h1>{t('politica.title')}</h1>
      </div>

      <div className="politica-container">
        <div className="politica-content">
          <section className="politica-section">
            <h2>{t('politica.introduccion')}</h2>
            <p>{t('politica.introduccionTexto')}</p>
          </section>

          <section className="politica-section">
            <h2>{t('politica.datos')}</h2>
            <p>{t('politica.datosTexto')}</p>
          </section>

          <section className="politica-section">
            <h2>{t('politica.usoDatos')}</h2>
            <p>{t('politica.usoDatosTexto')}</p>
          </section>

          <section className="politica-section">
            <h2>{t('politica.seguridad')}</h2>
            <p>{t('politica.seguridadTexto')}</p>
          </section>

          <section className="politica-section">
            <h2>{t('politica.cookies')}</h2>
            <p>{t('politica.cookiesTexto')}</p>
          </section>

          <section className="politica-section">
            <h2>{t('politica.derechos')}</h2>
            <p>{t('politica.derechosTexto')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPage;