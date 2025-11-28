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
            {/* 🎓 SECCIÓN 1: APRENDE INGLÉS */}
            <div className="section-card learn-card">
              <div className="section-icon">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  {/* Estrellas de fondo */}
                  <circle cx="15" cy="20" r="2" fill="#ffd54f" opacity="0.8">
                    <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="85" cy="25" r="1.5" fill="#80deea" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="20" cy="75" r="1.5" fill="#ff4081" opacity="0.6">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite"/>
                  </circle>
                  
                  {/* Libro abierto base */}
                  <path d="M 25 50 L 25 75 L 50 78 L 75 75 L 75 50 L 50 53 Z" fill="#c8b8e8" stroke="#4a3a6a" strokeWidth="2"/>
                  <line x1="50" y1="53" x2="50" y2="78" stroke="#4a3a6a" strokeWidth="2"/>
                  
                  {/* Páginas del libro */}
                  <path d="M 28 55 L 47 57" stroke="#d8c8f8" strokeWidth="1" opacity="0.7"/>
                  <path d="M 28 60 L 47 62" stroke="#d8c8f8" strokeWidth="1" opacity="0.7"/>
                  <path d="M 53 57 L 72 55" stroke="#d8c8f8" strokeWidth="1" opacity="0.7"/>
                  <path d="M 53 62 L 72 60" stroke="#d8c8f8" strokeWidth="1" opacity="0.7"/>
                  
                  {/* Gorro de graduación */}
                  <rect x="35" y="35" width="30" height="8" fill="#a898c8" stroke="#4a3a6a" strokeWidth="2" rx="1"/>
                  <path d="M 30 35 L 50 28 L 70 35 L 50 42 Z" fill="#b8a8d8" stroke="#4a3a6a" strokeWidth="2"/>
                  
                  {/* Borla dorada */}
                  <line x1="65" y1="35" x2="72" y2="20" stroke="#d4a574" strokeWidth="2"/>
                  <circle cx="72" cy="18" r="3" fill="#ffd700" stroke="#d4a574" strokeWidth="1.5"/>
                  
                  {/* Luna decorativa */}
                  <circle cx="80" cy="15" r="6" fill="#e8d8ff" opacity="0.8"/>
                  <circle cx="82" cy="15" r="5" fill="#c8b8e8" opacity="0.6"/>
                </svg>
              </div>
              <h3 className="section-title">{t('homepage.sections.learnEnglish.title')}</h3>
              <Link to="/aprender-ingles" className="section-button learn-button">
                {t('homepage.sections.learnEnglish.button')} →
              </Link>
              <p className="section-subtitle">{t('homepage.sections.learnEnglish.subtitle')}</p>
              <p className="section-description">
                {t('homepage.sections.learnEnglish.description')}
              </p>
              <p className="section-methodology">
                <em>{t('homepage.sections.learnEnglish.methodology')}</em>
              </p>
            </div>

            {/* 📚 SECCIÓN 2: BIBLIOTECA */}
            <div className="section-card library-card">
              <div className="section-icon">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  {/* Estrellas de fondo */}
                  <polygon points="85,15 87,20 92,20 88,24 90,29 85,25 80,29 82,24 78,20 83,20" fill="#ffd54f" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" from="0 85 22" to="360 85 22" dur="4s" repeatCount="indefinite"/>
                  </polygon>
                  <circle cx="18" cy="22" r="2" fill="#80deea" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="90" cy="70" r="1.5" fill="#ff4081" opacity="0.6">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite"/>
                  </circle>
                  
                  {/* Libro 1 - Lila */}
                  <rect x="25" y="45" width="18" height="35" fill="#c8b8e8" stroke="#4a3a6a" strokeWidth="2" rx="2" transform="rotate(-8 34 62)"/>
                  <line x1="27" y1="52" x2="41" y2="50" stroke="#d8c8f8" strokeWidth="1.5" opacity="0.6"/>
                  <line x1="27" y1="58" x2="41" y2="56" stroke="#d8c8f8" strokeWidth="1.5" opacity="0.6"/>
                  
                  {/* Libro 2 - Rosa */}
                  <rect x="38" y="50" width="18" height="33" fill="#ff8fab" stroke="#4a3a6a" strokeWidth="2" rx="2" transform="rotate(5 47 66)"/>
                  <line x1="40" y1="58" x2="54" y2="59" stroke="#ffc0d0" strokeWidth="1.5" opacity="0.6"/>
                  <line x1="40" y1="64" x2="54" y2="65" stroke="#ffc0d0" strokeWidth="1.5" opacity="0.6"/>
                  
                  {/* Libro 3 - Amarillo */}
                  <rect x="52" y="48" width="18" height="36" fill="#ffd54f" stroke="#4a3a6a" strokeWidth="2" rx="2" transform="rotate(-5 61 66)"/>
                  <line x1="54" y1="56" x2="68" y2="55" stroke="#ffeb8f" strokeWidth="1.5" opacity="0.6"/>
                  <line x1="54" y1="62" x2="68" y2="61" stroke="#ffeb8f" strokeWidth="1.5" opacity="0.6"/>
                  
                  {/* Formas geométricas Memphis */}
                  <circle cx="20" cy="70" r="4" fill="#80deea" opacity="0.6"/>
                  <rect x="75" y="50" width="8" height="8" fill="#9575cd" opacity="0.5" transform="rotate(45 79 54)"/>
                  
                  {/* Luna creciente */}
                  <circle cx="15" cy="30" r="7" fill="#e8d8ff" opacity="0.7"/>
                  <circle cx="17" cy="30" r="6" fill="#c8b8e8" opacity="0.5"/>
                </svg>
              </div>
              <h3 className="section-title">{t('homepage.sections.library.title')}</h3>
              <Link to="/ejemplos" className="section-button library-button">
                {t('homepage.sections.library.button')} →
              </Link>
              <p className="section-description">
                {t('homepage.sections.library.description')}
              </p>
            </div>

            {/* ✍️ SECCIÓN 3: CREA TUS CUENTOS */}
            <div className="section-card create-card">
              <div className="section-icon">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  {/* Estrellas brillantes */}
                  <polygon points="20,25 22,30 27,30 23,34 25,39 20,35 15,39 17,34 13,30 18,30" fill="#ffd54f">
                    <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
                  </polygon>
                  <circle cx="80" cy="30" r="2" fill="#80deea">
                    <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="25" cy="70" r="1.5" fill="#ff4081" opacity="0.8">
                    <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite"/>
                  </circle>
                  
                  {/* Lápiz mágico principal */}
                  <rect x="35" y="30" width="12" height="45" fill="#ffd54f" stroke="#4a3a6a" strokeWidth="2" rx="2" transform="rotate(-25 41 52)"/>
                  <path d="M 32 66 L 41 52 L 47 55 L 38 69 Z" fill="#ffb74d" stroke="#4a3a6a" strokeWidth="2" transform="rotate(-25 41 52)"/>
                  <polygon points="32,66 35,75 38,69" fill="#d4a574" stroke="#4a3a6a" strokeWidth="1.5" transform="rotate(-25 41 52)"/>
                  
                  {/* Goma de borrar lila */}
                  <rect x="40" y="28" width="7" height="8" fill="#c8b8e8" stroke="#4a3a6a" strokeWidth="1.5" rx="1" transform="rotate(-25 41 52)"/>
                  
                  {/* Líneas mágicas saliendo del lápiz */}
                  <path d="M 25 75 Q 30 72 35 75" stroke="#9575cd" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round"/>
                  <path d="M 30 80 Q 35 78 40 82" stroke="#80deea" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round"/>
                  <path d="M 22 82 Q 25 80 28 83" stroke="#ff4081" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round"/>
                  
                  {/* Destellos creativos */}
                  <line x1="60" y1="45" x2="70" y2="40" stroke="#ffd54f" strokeWidth="2" opacity="0.8" strokeLinecap="round">
                    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite"/>
                  </line>
                  <line x1="55" y1="55" x2="65" y2="58" stroke="#ff4081" strokeWidth="2" opacity="0.7" strokeLinecap="round">
                    <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.2s" repeatCount="indefinite"/>
                  </line>
                  <line x1="62" y1="50" x2="72" y2="52" stroke="#80deea" strokeWidth="2" opacity="0.6" strokeLinecap="round">
                    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.4s" repeatCount="indefinite"/>
                  </line>
                  
                  {/* Formas geométricas Memphis flotantes */}
                  <circle cx="75" cy="65" r="5" fill="#c8b8e8" opacity="0.5"/>
                  <rect x="80" y="72" width="6" height="6" fill="#ff8fab" opacity="0.5" transform="rotate(30 83 75)"/>
                  
                  {/* Planeta decorativo */}
                  <circle cx="85" cy="20" r="6" fill="#9575cd" opacity="0.6"/>
                  <ellipse cx="85" cy="20" rx="10" ry="2" fill="none" stroke="#d8c8f8" strokeWidth="1.5" opacity="0.5"/>
                </svg>
              </div>
              <h3 className="section-title">{t('homepage.sections.create.title')}</h3>
              <Link to="/crear-cuento" className="section-button create-button">
                {t('homepage.sections.create.button')} →
              </Link>
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