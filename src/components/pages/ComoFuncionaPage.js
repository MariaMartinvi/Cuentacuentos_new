import React from 'react';
import { useTranslation } from 'react-i18next';
import './ComoFuncionaPage.css';
import SEO from '../SEO';

const ComoFuncionaPage = () => {
  const { t, i18n } = useTranslation();

  const steps = [
    {
      key: 'step1',
      icon: '🎯'
    },
    {
      key: 'step2',
      icon: '✨'
    },
    {
      key: 'step3',
      icon: '🎧'
    }
  ];

  return (
    <div className="como-funciona-page">
      <SEO 
        title={i18n.language === 'es' ? 
          'Cómo Funciona - Mi Cuentacuentos' : 
          'How It Works - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Descubre cómo funciona Mi Cuentacuentos. Aprende a crear cuentos personalizados y convertirlos en audio en simples pasos.' : 
          'Discover how My Storyteller works. Learn to create personalized stories and convert them to audio in simple steps.'}
        keywords={['cómo funciona', 'tutorial', 'guía de uso', 'crear cuentos', 'convertir a audio', 'pasos', 'instrucciones']}
        lang={i18n.language}
      />
      
      <div className="page-header">
        <h1>{t('comoFunciona.title')}</h1>
        <p>{t('comoFunciona.description')}</p>
      </div>

      <div className="como-funciona-container">
        <div className="como-funciona-content">
          <div className="steps-container">
            {steps.map((step, index) => (
              <div key={step.key} className="step">
                <div className="step-number">{index + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <h2>{t(`comoFunciona.${step.key}.title`)}</h2>
                <p>{t(`comoFunciona.${step.key}.description`)}</p>
                <div className="step-features">
                  {Object.keys(t(`comoFunciona.${step.key}.features`, { returnObjects: true })).map((feature) => (
                    <div key={feature} className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span className="feature-text">
                        {t(`comoFunciona.${step.key}.features.${feature}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComoFuncionaPage;