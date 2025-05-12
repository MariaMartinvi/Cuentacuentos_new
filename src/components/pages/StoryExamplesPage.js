import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './StoryExamplesPage.css';
import SEO from '../SEO';
import { fetchStoryExamples, getStoryTextUrl, getStoryAudioUrl } from '../../services/storyExamplesService';
import { Spinner } from 'react-bootstrap';
import AudioPlayer from '../AudioPlayer';

// Mock data for when Firebase data can't be loaded
const MOCK_STORIES = [
  {
    id: 'dragon-no-volar',
    title: 'El dragón que no podía volar',
    age: '3to5',
    language: 'spanish',
    level: 'beginner',
    textPath: 'stories/dragon-no-volar.txt',
    audioPath: 'audio/dragon-no-volar.mp3'
  },
  {
    id: 'princesa-valiente',
    title: 'La princesa valiente',
    age: '6to8',
    language: 'spanish',
    level: 'intermediate',
    textPath: 'stories/princesa-valiente.txt',
    audioPath: 'audio/princesa-valiente.mp3'
  },
  {
    id: 'magic-forest',
    title: 'The Magic Forest',
    age: '6to8',
    language: 'english',
    level: 'beginner',
    textPath: 'stories/magic-forest.txt',
    audioPath: 'audio/magic-forest.mp3'
  }
];

// Story modal component
const StoryModal = ({ isOpen, onClose, title, content, audioUrl, showAudio }) => {
  if (!isOpen) return null;

  // Format the story text to display properly
  const formatStoryContent = (text) => {
    if (!text) {
      console.log("No content provided to format");
      return (
        <div className="story-content">
          <h1>{title}</h1>
          <p>No story content available.</p>
        </div>
      );
    }
    
    console.log("Formatting story content:", text);
    
    // Split by new lines and convert to paragraphs
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    console.log("Paragraphs:", paragraphs);
    
    // If we have at least one paragraph
    if (paragraphs.length > 0) {
      // First paragraph is the title (if it doesn't already match our title)
      const storyTitle = paragraphs[0] === title ? title : paragraphs[0];
      const storyParagraphs = paragraphs[0] === title ? paragraphs.slice(1) : paragraphs.slice(1);
      
      return (
        <div className="story-content">
          <h1>{storyTitle}</h1>
          {storyParagraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      );
    } else {
      // If we couldn't parse paragraphs, just display the text as is
      return (
        <div className="story-content">
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
      );
    }
  };

  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Handle close button click with stopPropagation
  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal" onClick={handleModalClick}>
        <button className="story-modal-close" onClick={handleCloseClick}>&times;</button>
        {formatStoryContent(content)}
        {showAudio && audioUrl && <AudioPlayer audioUrl={audioUrl} title={title} />}
      </div>
    </div>
  );
};

const StoryCard = ({ story, t, useMockData = false }) => {
  const [textUrl, setTextUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [showAudio, setShowAudio] = useState(false);

  // Always use the mock story for development/testing
  const MOCK_STORY = `${story.title}

Había una vez un pequeño dragón llamado Puff que vivía en las montañas azules. A diferencia de otros dragones, Puff tenía un problema: no podía volar. Sus alas eran demasiado pequeñas y por más que lo intentaba, no lograba elevarse del suelo.

Todos los días, Puff observaba a los otros dragones volar alto en el cielo, haciendo piruetas y jugando entre las nubes. Se sentía muy triste porque quería jugar con ellos, pero no podía.

Un día, mientras caminaba por el bosque, Puff encontró a una pequeña niña que estaba perdida. La niña lloraba porque no podía encontrar el camino a su casa.

"No llores", le dijo Puff. "Yo te ayudaré a encontrar tu casa".

La niña se sorprendió al ver un dragón tan amable. Juntos caminaron por el bosque, y Puff usó su excelente sentido del olfato para seguir el rastro hasta la aldea donde vivía la niña.

Cuando llegaron, todos los habitantes del pueblo estaban asombrados. ¡Un dragón había ayudado a la niña! Estaban tan agradecidos que organizaron una gran fiesta para Puff.

Durante la fiesta, Puff se dio cuenta de algo importante: aunque no podía volar como los otros dragones, tenía otras habilidades especiales. Era amable, valiente y tenía un gran sentido del olfato que le permitía ayudar a los demás.

Desde ese día, Puff ya no se sintió triste por no poder volar. Había encontrado su propio camino para ser feliz y ayudar a los demás. Y así, el dragón que no podía volar se convirtió en el dragón más querido de todas las montañas azules.

Fin`;

  useEffect(() => {
    const loadUrls = async () => {
      try {
        setLoading(true);
        
        // For development and testing, always use mock data
        // This ensures we have content to display regardless of Firebase permissions
        setTextUrl('#');
        setAudioUrl('#');
        setStoryContent(MOCK_STORY);
        
        // Only try to fetch real content if not using mock data
        if (!useMockData) {
          if (story.textPath) {
            try {
              const url = await getStoryTextUrl(story.textPath);
              setTextUrl(url);
              
              // Fetch the actual story content
              console.log("Fetching story from URL:", url);
              const response = await fetch(url);
              if (!response.ok) {
                throw new Error(`Failed to fetch story: ${response.status} ${response.statusText}`);
              }
              const text = await response.text();
              console.log("Story content fetched, length:", text.length);
              if (text && text.trim().length > 0) {
                setStoryContent(text);
              }
            } catch (err) {
              console.error("Error fetching story content:", err);
              // Keep using the mock story content
            }
          }
          
          if (story.audioPath) {
            try {
              const url = await getStoryAudioUrl(story.audioPath);
              setAudioUrl(url);
            } catch (err) {
              console.error("Error fetching audio URL:", err);
              // Keep using the mock audio URL
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading story URLs:", error);
        setError(error);
        setLoading(false);
        // Keep using the mock story content
      }
    };
    
    loadUrls();
  }, [story, useMockData, MOCK_STORY]);

  const openTextModal = (e) => {
    e.preventDefault();
    console.log("Opening text modal with content:", storyContent);
    setShowAudio(false);
    setIsModalOpen(true);
  };

  const openAudioModal = (e) => {
    e.preventDefault();
    console.log("Opening audio modal with content:", storyContent);
    setShowAudio(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log("Closing modal");
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="story-card loading">
        <div className="spinner-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  if (error && !useMockData) {
    return (
      <div className="story-card error">
        <h3>{story.title}</h3>
        <p className="text-danger">Error loading story resources</p>
      </div>
    );
  }

  return (
    <>
      <div className="story-card">
        <h3>{story.title}</h3>
        <div className="story-details">
          <p><strong>{t('storyExamples.storyCard.recommendedAge')}</strong> {t(`storyExamples.ageGroups.${story.age}`)}</p>
          <p><strong>{t('storyExamples.storyCard.language')}</strong> {t(`storyExamples.languages.${story.language}`)}</p>
          <p><strong>{t('storyExamples.storyCard.level')}</strong> {t(`storyExamples.levels.${story.level}`)}</p>
        </div>
        <div className="story-actions">
          {(textUrl || useMockData) && (
            <a href={textUrl} onClick={openTextModal} className="story-link">
              {t('storyExamples.storyCard.readStory')}
            </a>
          )}
          {(audioUrl || useMockData) && (
            <a href={audioUrl} onClick={openAudioModal} className="story-link audio-link">
              {t('storyExamples.storyCard.listenAudio')}
            </a>
          )}
        </div>
      </div>
      
      <StoryModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        title={story.title}
        content={storyContent}
        audioUrl={audioUrl}
        showAudio={showAudio}
      />
    </>
  );
};

const StoryExamplesPage = () => {
  const { t, i18n } = useTranslation();
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useMockData, setUseMockData] = useState(false);
  const [filters, setFilters] = useState({
    age: 'all',
    language: 'all',
    level: 'all'
  });

  // Fetch stories from Firebase
  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        const storyData = await fetchStoryExamples();
        setStories(storyData);
        setFilteredStories(storyData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading stories:", error);
        setError(error);
        setLoading(false);
        
        // If Firebase fails, use mock data
        setUseMockData(true);
        setStories(MOCK_STORIES);
        setFilteredStories(MOCK_STORIES);
      }
    };
    
    loadStories();
  }, []);

  // Apply filters locally
  useEffect(() => {
    if (stories.length > 0) {
      const filtered = stories.filter(story => {
        return (filters.age === 'all' || story.age === filters.age) &&
               (filters.language === 'all' || story.language === filters.language) &&
               (filters.level === 'all' || story.level === filters.level);
      });
      
      setFilteredStories(filtered);
    }
  }, [filters, stories]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  return (
    <div className="story-examples-page">
      <SEO 
        title={i18n.language === 'es' ? 
          'Ejemplos de Cuentos - Mi Cuentacuentos' : 
          'Story Examples - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Explora nuestra colección de cuentos de ejemplo para todas las edades y niveles de idioma.' : 
          'Explore our collection of example stories for all ages and language levels.'}
        keywords={['ejemplos de cuentos', 'cuentos para niños', 'cuentos en español', 'cuentos en inglés']}
        lang={i18n.language}
      />
      
      <div className="page-header">
        <h1>{t('storyExamples.title')}</h1>
        <p>{t('storyExamples.description')}</p>
        {useMockData && (
          <div className="alert alert-warning">
            <strong>Note:</strong> Using sample data. To see real stories, please update your Firebase security rules as described in the README.
          </div>
        )}
      </div>

      <div className="filters-container">
        <h2>{t('storyExamples.filters.title')}</h2>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="age-filter">{t('storyExamples.filters.age')}</label>
            <select 
              id="age-filter" 
              value={filters.age}
              onChange={(e) => handleFilterChange('age', e.target.value)}
            >
              <option value="all">{t('storyExamples.ageGroups.all')}</option>
              <option value="3to5">{t('storyExamples.ageGroups.3to5')}</option>
              <option value="6to8">{t('storyExamples.ageGroups.6to8')}</option>
              <option value="9to12">{t('storyExamples.ageGroups.9to12')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="language-filter">{t('storyExamples.filters.language')}</label>
            <select 
              id="language-filter" 
              value={filters.language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
            >
              <option value="all">{t('storyExamples.languages.all')}</option>
              <option value="spanish">{t('storyExamples.languages.spanish')}</option>
              <option value="english">{t('storyExamples.languages.english')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="level-filter">{t('storyExamples.filters.level')}</label>
            <select 
              id="level-filter" 
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="all">{t('storyExamples.levels.all')}</option>
              <option value="beginner">{t('storyExamples.levels.beginner')}</option>
              <option value="intermediate">{t('storyExamples.levels.intermediate')}</option>
              <option value="advanced">{t('storyExamples.levels.advanced')}</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error && !useMockData ? (
        <div className="error-container">
          <p className="text-danger">Error loading stories. Please try again later.</p>
        </div>
      ) : (
        <div className="stories-grid">
          {filteredStories.length > 0 ? (
            filteredStories.map(story => (
              <StoryCard key={story.id} story={story} t={t} useMockData={useMockData} />
            ))
          ) : (
            <p className="no-results">{t('storyExamples.noResults')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryExamplesPage; 