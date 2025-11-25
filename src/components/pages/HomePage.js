import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoryExamplesSection from '../StoryExamplesSection.js';
import TestimonialsSection from '../TestimonialsSection.js';
import '../../styles/global.css';
import '../FeaturesSection.css';
import SEO from '../SEO';
import BreadcrumbSchema from '../BreadcrumbSchema.js';

function HomePage() {
  const { t, i18n } = useTranslation();

  // SEO metadata para la página principal
  const keywords = [
    'generador de cuentos', 
    'cuentos para dormir', 
    'historias para niños', 
    'aprender inglés', 
    'audiocuentos personalizados',
    'cuentos infantiles',
    'historias con IA'
  ];

  // Breadcrumb items
  const breadcrumbItems = [
    {
      name: i18n.language === 'es' ? 'Inicio' : 'Home',
      url: '/'
    }
  ];

  return (
    <div className="app">
      <SEO 
        title={i18n.language === 'es' ? 
          'AudioGretel - Audiocuentos personalizados para niños' : 
          'AudioGretel - Personalized audio stories for children'}
        description={i18n.language === 'es' ? 
          'Genera audiocuentos personalizados para niños con inteligencia artificial. Convierte historias en audio con diferentes voces y acentos para aprender idiomas.' : 
          'Generate personalized audio stories for children with artificial intelligence. Convert stories to audio with different voices and accents to learn languages.'}
        keywords={keywords}
        lang={i18n.language}
        pageType="WebSite"
      >
        {/* FAQ Schema for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': i18n.language === 'es' ? '¿Cómo funciona AudioGretel?' : 'How does AudioGretel work?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': i18n.language === 'es' ? 
                    'Simplemente ingresa los datos del personaje principal, tema y otros detalles para generar un cuento personalizado. Luego puedes escucharlo en audio en varios idiomas y voces.' : 
                    'Simply enter the main character details, theme, and other information to generate a personalized story. You can then listen to it in audio in various languages and voices.'
                }
              },
              {
                '@type': 'Question',
                'name': i18n.language === 'es' ? '¿Puedo usar AudioGretel para aprender idiomas?' : 'Can I use AudioGretel to learn languages?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': i18n.language === 'es' ? 
                    'Sí, puedes generar y escuchar historias en diferentes idiomas con distintos acentos para practicar y mejorar tus habilidades lingüísticas.' : 
                    'Yes, you can generate and listen to stories in different languages with various accents to practice and improve your language skills.'
                }
              }
            ]
          })}
        </script>
      </SEO>

      <BreadcrumbSchema items={breadcrumbItems} />
      
      <div className="hero-section">
        <div className="hero-container">
          <h1>{t('homepage.heroTitle')}</h1>
          <p>
            {t('homepage.heroDescription').split(':').map((part, index, array) => {
              if (index === array.length - 1) {
                return <span key={index} className="language-levels">{part}</span>;
              }
              return part + ':';
            })}
          </p>
        </div>
      </div>

      <div className="main-content">
        {/* 1️⃣ PRIMERO: Explora nuestros cuentos */}
        <StoryExamplesSection />
        
        {/* 2️⃣ SEGUNDO: CTA para crear cuento */}
        <div className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              <h2 className="cta-title">
                {i18n.language === 'es' ? '✨ ¿Listo para crear tu propia historia?' : '✨ Ready to create your own story?'}
              </h2>
              <p className="cta-description">
                {i18n.language === 'es' 
                  ? 'Genera audiocuentos personalizados en segundos. Elige el personaje, tema, edad y mucho más.' 
                  : 'Generate personalized audio stories in seconds. Choose the character, theme, age, and much more.'}
              </p>
              <Link to="/crear-cuento" className="cta-button">
                {i18n.language === 'es' ? '🎯 Crear Mi Cuento Ahora' : '🎯 Create My Story Now'}
              </Link>
              <p className="cta-note">
                {i18n.language === 'es' ? '✓ Gratis • ✓ Sin registro requerido • ✓ Audio incluido' : '✓ Free • ✓ No registration required • ✓ Audio included'}
              </p>
            </div>
          </div>
        </div>
        
        {/* 3️⃣ TERCERO: Características */}
        <div className="features-section">
          <div className="container">
            <h2 className="section-title">{t('homepage.featuresTitle')}</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>{t('homepage.uniqueStoriesTitle')}</h3>
                <p>{t('homepage.uniqueStoriesDescription')}</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🌍</div>
                <h3>{t('homepage.languageLevelsTitle')}</h3>
                <p>{t('homepage.languageLevelsDescription')}</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🎧</div>
                <h3>{t('homepage.audioConversionTitle')}</h3>
                <p>{t('homepage.audioConversionDescription')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 4️⃣ CUARTO: Testimonios */}
        <TestimonialsSection />
        
        {/* 5️⃣ QUINTO: Herramientas IA */}
        <div className="ai-tools-section">
          <div className="ai-tools-container">
            <h2 className="ai-tools-title">
              {t('aiTools.title')}
            </h2>
            <div className="ai-tools-grid">
              <a 
                href="/herramientas/generador-audiocuentos" 
                className="ai-tool-card"
              >
                <div className="ai-tool-icon">🛠️</div>
                <h3 className="ai-tool-title">
                  {t('aiTools.audioStoryGenerator.title')}
                </h3>
                <p className="ai-tool-description">
                  {t('aiTools.audioStoryGenerator.description')}
                </p>
              </a>
              
              <a 
                href="/como-generar-audiocuentos-ia" 
                className="ai-tool-card"
              >
                <div className="ai-tool-icon">📚</div>
                <h3 className="ai-tool-title">
                  {t('aiTools.completeGuide.title')}
                </h3>
                <p className="ai-tool-description">
                  {t('aiTools.completeGuide.description')}
                </p>
              </a>
              
              <a 
                href="/ejemplos" 
                className="ai-tool-card"
              >
                <div className="ai-tool-icon">🎵</div>
                <h3 className="ai-tool-title">
                  {t('aiTools.audioStoryExamples.title')}
                </h3>
                <p className="ai-tool-description">
                  {t('aiTools.audioStoryExamples.description')}
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;