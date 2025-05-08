// src/components/pages/AboutPage.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import './AboutPage.css';
import SEO from '../SEO';

const AboutPage = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="about-page">
      <SEO 
        title={i18n.language === 'es' ? 
          'Sobre Nosotros - Mi Cuentacuentos' : 
          'About Us - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Conoce más sobre Mi Cuentacuentos, nuestra misión, visión y el equipo detrás de esta plataforma de cuentos personalizados.' : 
          'Learn more about My Storyteller, our mission, vision and the team behind this personalized storytelling platform.'}
        keywords={['sobre nosotros', 'equipo creativo', 'misión', 'visión', 'valores', 'cuentos personalizados']}
        lang={i18n.language}
      />
      
      <div className="page-header">
        <h1>{t('about.title')}</h1>
        <p>{t('about.subtitle')}</p>
      </div>

      <div className="about-container">
        <div className="about-content">
          <div className="about-text">
            <h2>{t('about.mission.title')}</h2>
            <p>{t('about.mission.text')}</p>
          </div>
        </div>

        <div className="about-content">
          <div className="about-text">
            <h2>{t('about.vision.title')}</h2>
            <p>{t('about.vision.text')}</p>
          </div>
        </div>

        <div className="team-section">
          <h2 className="section-title">{t('about.team.title')}</h2>
          <p className="team-description">
            {t('about.team.description')}{' '}
            <a href="https://www.comartinvi.com/" target="_blank" rel="noopener noreferrer" className="team-link">
              comartinvi.com
            </a>
          </p>
          <div className="team-grid">
            <div className="team-member">
              <h3>{t('about.team.members.developer.name')}</h3>
              <p>{t('about.team.members.developer.role')}</p>
            </div>
            <div className="team-member">
              <h3>{t('about.team.members.writer.name')}</h3>
              <p>{t('about.team.members.writer.role')}</p>
            </div>
            <div className="team-member">
              <h3>{t('about.team.members.creative.name')}</h3>
              <p>{t('about.team.members.creative.role')}</p>
            </div>
          </div>
        </div>

        <div className="about-content">
          <div className="about-text">
            <h2>{t('about.values.title')}</h2>
            <div className="values-grid">
              <div className="value-item">
                <h3>{t('about.values.creatividad')}</h3>
                <p>{t('about.values.creatividadText')}</p>
              </div>
              <div className="value-item">
                <h3>{t('about.values.accesibilidad')}</h3>
                <p>{t('about.values.accesibilidadText')}</p>
              </div>
              <div className="value-item">
                <h3>{t('about.values.calidad')}</h3>
                <p>{t('about.values.calidadText')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;