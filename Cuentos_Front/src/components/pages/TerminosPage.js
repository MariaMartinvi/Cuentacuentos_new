// filepath: c:\Users\Tiendeo\nombre-del-proyecto\src\components\pages\TerminosPage.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import './TerminosPage.css';
import SEO from '../SEO';

const TerminosPage = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="terminos-page">
      <SEO 
        title={i18n.language === 'es' ? 
          'Términos y Condiciones - Mi Cuentacuentos' : 
          'Terms and Conditions - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Términos y condiciones de uso de Mi Cuentacuentos. Información sobre suscripciones, propiedad intelectual y limitaciones de responsabilidad.' : 
          'Terms and conditions of use for My Storyteller. Information about subscriptions, intellectual property and liability limitations.'}
        keywords={['términos y condiciones', 'condiciones de uso', 'suscripción', 'propiedad intelectual', 'limitación de responsabilidad']}
        lang={i18n.language}
      />
      
      <div className="page-header">
        <h1>{t('terminos.title')}</h1>
      </div>

      <div className="terminos-container">
        <div className="terminos-content">
          <section className="terminos-section">
            <h2>{t('terminos.introduccion')}</h2>
            <p>{t('terminos.introduccionTexto')}</p>
          </section>

          <section className="terminos-section">
            <h2>{t('terminos.uso')}</h2>
            <p>{t('terminos.usoTexto')}</p>
          </section>

          <section className="terminos-section">
            <h2>{t('terminos.suscripcion')}</h2>
            <p>{t('terminos.suscripcionTexto')}</p>
          </section>

          <section className="terminos-section">
            <h2>{t('terminos.propiedad')}</h2>
            <p>{t('terminos.propiedadTexto')}</p>
          </section>

          <section className="terminos-section">
            <h2>{t('terminos.limitacion')}</h2>
            <p>{t('terminos.limitacionTexto')}</p>
          </section>

          <section className="terminos-section">
            <h2>{t('terminos.contacto')}</h2>
            <p>{t('terminos.contactoTexto')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TerminosPage;