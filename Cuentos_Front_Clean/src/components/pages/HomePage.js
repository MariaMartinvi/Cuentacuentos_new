import React, { useState } from 'react';
import StoryForm from '../StoryForm.js';
import { useTranslation } from 'react-i18next';
import StoryDisplay from '../StoryDisplay.js';
import '../../styles/global.css';
import '../FeaturesSection.css';
import SEO from '../SEO';

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
      />
      
      <div className="hero-section">
        <div className="hero-container">
          <h1>{t('homepage.heroTitle')}</h1>
          <p>{t('homepage.heroDescription')}</p>
        </div>
      </div>

      <main className="container">
        <StoryForm onStoryGenerated={handleStoryGenerated} />

        {generatedStory && (
          <StoryDisplay story={generatedStory} />
        )}

        {!generatedStory && (
          <div className="features-preview">
            <h2>{t('homepage.featuresTitle')}</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">✨</div>
                <h3>{t('homepage.uniqueStoriesTitle')}</h3>
                <p>{t('homepage.uniqueStoriesDescription')}</p>
                <a href="#" onClick={scrollToStoryForm}>{t('common.learnMore')}</a>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🎭</div>
                <h3>{t('homepage.multipleGenresTitle')}</h3>
                <p>{t('homepage.multipleGenresDescription')}</p>
                <a href="#" onClick={scrollToStoryForm}>{t('common.learnMore')}</a>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔊</div>
                <h3>{t('homepage.audioConversionTitle')}</h3>
                <p>{t('homepage.audioConversionDescription')}</p>
                <a href="#" onClick={scrollToStoryForm}>{t('common.learnMore')}</a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;