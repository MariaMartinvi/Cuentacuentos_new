import React, { useState } from 'react';
import StoryForm from '../StoryForm.js';
import { useTranslation } from 'react-i18next';
import StoryDisplay from '../StoryDisplay.js';
import StoryExamplesSection from '../StoryExamplesSection.js';
import '../../styles/global.css';
import '../FeaturesSection.css';
import SEO from '../SEO';
import BreadcrumbSchema from '../BreadcrumbSchema.js';

function HomePage() {
  const [generatedStory, setGeneratedStory] = useState(null);
  const { t, i18n } = useTranslation();

  const handleStoryGenerated = (story) => {
    setGeneratedStory(story);

    // Scroll to story if generated
    if (story) {
      setTimeout(() => {
        const storyDisplay = document.querySelector('.story-display');
        if (storyDisplay) {
          storyDisplay.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const scrollToStoryForm = (e) => {
    e.preventDefault();
    const storyForm = document.querySelector('.story-form-container');
    if (storyForm) {
      storyForm.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
          'Mi Cuentacuentos - Audiocuentos personalizados para niños' : 
          'My Storyteller - Personalized audio stories for children'}
        description={i18n.language === 'es' ? 
          'Genera cuentos personalizados para niños con inteligencia artificial. Convierte historias en audio con diferentes voces y acentos para aprender idiomas.' : 
          'Generate personalized stories for children with artificial intelligence. Convert stories to audio with different voices and accents to learn languages.'}
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
                'name': i18n.language === 'es' ? '¿Cómo funciona Mi Cuentacuentos?' : 'How does My Storyteller work?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': i18n.language === 'es' ? 
                    'Simplemente ingresa los datos del personaje principal, tema y otros detalles para generar un cuento personalizado. Luego puedes escucharlo en audio en varios idiomas y voces.' : 
                    'Simply enter the main character details, theme, and other information to generate a personalized story. You can then listen to it in audio in various languages and voices.'
                }
              },
              {
                '@type': 'Question',
                'name': i18n.language === 'es' ? '¿Puedo usar Mi Cuentacuentos para aprender idiomas?' : 'Can I use My Storyteller to learn languages?',
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
          <p>{t('homepage.heroDescription')}</p>
        </div>
      </div>

      <div className="main-content">
        <div className="container">
          <StoryForm onStoryGenerated={handleStoryGenerated} />
          
          {generatedStory && (
            <StoryDisplay story={generatedStory} />
          )}
        </div>
        
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
                <h3>Diferentes Niveles de Idioma</h3>
                <p>Nivel básico, intermedio o avanzado de inglés y español. Aprende idiomas mientras escuchas un cuento.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🎧</div>
                <h3>{t('homepage.audioConversionTitle')}</h3>
                <p>{t('homepage.audioConversionDescription')}</p>
              </div>
            </div>
          </div>
        </div>

        <StoryExamplesSection />
      </div>
    </div>
  );
}

export default HomePage;