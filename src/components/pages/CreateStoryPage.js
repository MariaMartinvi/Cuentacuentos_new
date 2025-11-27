import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StoryForm from '../StoryForm.js';
import { useTranslation } from 'react-i18next';
import StoryDisplay from '../StoryDisplay.js';
import { getStoryById } from '../../services/storyService.js';
import '../../styles/global.css';
import './CreateStoryPage.css';
import SEO from '../SEO';
import BreadcrumbSchema from '../BreadcrumbSchema.js';

function CreateStoryPage() {
  const [generatedStory, setGeneratedStory] = useState(null);
  const [loadingStory, setLoadingStory] = useState(false);
  const [storyError, setStoryError] = useState(null);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Load story from URL parameter if present
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const storyId = urlParams.get('storyId');
    
    if (storyId && !generatedStory) {
      loadStoryById(storyId);
    }
  }, [location.search, generatedStory]);

  const loadStoryById = async (storyId) => {
    setLoadingStory(true);
    setStoryError(null);
    
    try {
      console.log('Loading story with ID:', storyId);
      const response = await getStoryById(storyId);
      
      if (response.success && response.story) {
        setGeneratedStory(response.story);
        
        // Scroll to story after loading
        setTimeout(() => {
          const storyDisplay = document.querySelector('.story-display');
          if (storyDisplay) {
            storyDisplay.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        
        // Clean up URL
        navigate('/crear-cuento', { replace: true });
      } else {
        throw new Error('Story not found');
      }
    } catch (error) {
      console.error('Error loading story:', error);
      setStoryError(error.message);
      // Clean up URL on error
      navigate('/crear-cuento', { replace: true });
    } finally {
      setLoadingStory(false);
    }
  };

  const handleStoryGenerated = (story) => {
    setGeneratedStory(story);
    setStoryError(null);

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

  // SEO metadata para la página de creación
  const keywords = [
    'crear cuento personalizado', 
    'generador de cuentos online', 
    'crear audiocuento', 
    'historias personalizadas para niños', 
    'crear cuento con IA',
    'generar cuento infantil',
    'crear historia para niños'
  ];

  // Breadcrumb items
  const breadcrumbItems = [
    {
      name: i18n.language === 'es' ? 'Inicio' : 'Home',
      url: '/'
    },
    {
      name: i18n.language === 'es' ? 'Crear Cuento' : 'Create Story',
      url: '/crear-cuento'
    }
  ];

  return (
    <div className="create-story-page">
      <SEO 
        title={i18n.language === 'es' ? 
          'Crear Cuento Personalizado - AudioGretel' : 
          'Create Personalized Story - AudioGretel'}
        description={i18n.language === 'es' ? 
          'Crea tu audiocuento personalizado con inteligencia artificial. Elige el personaje, tema, edad y genera historias únicas con audio en múltiples idiomas.' : 
          'Create your personalized audio story with artificial intelligence. Choose the character, theme, age, and generate unique stories with audio in multiple languages.'}
        keywords={keywords}
        lang={i18n.language}
        pageType="WebPage"
      />

      <BreadcrumbSchema items={breadcrumbItems} />
      
      <div className="create-story-hero">
        <div className="create-story-hero-container">
          <h1 className="create-story-title">
            {t('createStoryPage.title')}
          </h1>
          <p className="create-story-subtitle">
            {t('createStoryPage.subtitle')}
          </p>
        </div>
      </div>

      <div className="create-story-content">
        <div className="container">
          <StoryForm onStoryGenerated={handleStoryGenerated} />
          
          {loadingStory && (
            <div className="story-loading-container">
              <div className="story-loading">
                <div className="loading-spinner"></div>
                <p>{i18n.language === 'es' ? 'Cargando tu historia...' : 'Loading your story...'}</p>
              </div>
            </div>
          )}
          
          {storyError && (
            <div className="story-error-container">
              <div className="story-error">
                <p>{i18n.language === 'es' ? 'Error al cargar la historia: ' : 'Error loading story: '}{storyError}</p>
                <button 
                  className="retry-button"
                  onClick={() => window.location.reload()}
                >
                  {i18n.language === 'es' ? 'Intentar de nuevo' : 'Try again'}
                </button>
              </div>
            </div>
          )}
          
          {generatedStory && !loadingStory && (
            <StoryDisplay story={generatedStory} />
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateStoryPage;

