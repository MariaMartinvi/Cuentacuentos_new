import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TestimonialsSection from '../TestimonialsSection.js';
import '../../styles/global.css';
import '../../styles/landing-sections.css';
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
          <p className="hero-intro">{t('homepage.heroIntro')}</p>
          <p className="hero-mission">{t('homepage.heroMission')}</p>
        </div>
      </div>

      {/* 🎯 NUEVA SECCIÓN: LAS 3 ÁREAS DE AUDIOGRETEL */}
      <div className="three-sections-area">
        <div className="container">
          <h2 className="sections-main-title">{t('homepage.sectionsTitle')}</h2>
          
          <div className="sections-grid">
            {/* 📚 SECCIÓN 1: BIBLIOTECA */}
            <div className="section-card library-card">
              <div className="section-icon">📚</div>
              <h3 className="section-title">{t('homepage.sections.library.title')}</h3>
              <p className="section-description">
                {t('homepage.sections.library.description')}
              </p>
              <Link to="/ejemplos" className="section-button library-button">
                {t('homepage.sections.library.button')} →
              </Link>
            </div>

            {/* ✍️ SECCIÓN 2: CREA TUS CUENTOS */}
            <div className="section-card create-card">
              <div className="section-icon">✍️</div>
              <h3 className="section-title">{t('homepage.sections.create.title')}</h3>
              <div className="create-modes">
                <div className="mode-item">
                  <strong>🎨 {t('homepage.sections.create.funMode')}:</strong>
                  <p>{t('homepage.sections.create.funModeDescription')}</p>
                </div>
                <div className="mode-item">
                  <strong>📖 {t('homepage.sections.create.learningMode')}:</strong>
                  <p>{t('homepage.sections.create.learningModeDescription')}</p>
                </div>
              </div>
              <Link to="/crear-cuento" className="section-button create-button">
                {t('homepage.sections.create.button')} →
              </Link>
            </div>

            {/* 🎓 SECCIÓN 3: APRENDE INGLÉS */}
            <div className="section-card learn-card">
              <div className="section-icon">🎓</div>
              <h3 className="section-title">{t('homepage.sections.learnEnglish.title')}</h3>
              <p className="section-subtitle">{t('homepage.sections.learnEnglish.subtitle')}</p>
              <p className="section-description">
                {t('homepage.sections.learnEnglish.description')}
              </p>
              <p className="section-methodology">
                <em>{t('homepage.sections.learnEnglish.methodology')}</em>
              </p>
              <Link to="/aprender-ingles" className="section-button learn-button">
                {t('homepage.sections.learnEnglish.button')} →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* 2️⃣ SECCIÓN CTA - ELIMINADA (no aporta valor por ahora) */}
        {/* <div className="cta-section">
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
        </div> */}
        
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
        
        {/* 5️⃣ SECCIÓN HERRAMIENTAS IA - ELIMINADA (no aporta valor por ahora) */}
        {/* <div className="ai-tools-section">
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
        </div> */}
      </div>
    </div>
  );
}

export default HomePage;