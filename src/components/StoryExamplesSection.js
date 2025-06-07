import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { fetchStoryExamples, checkStoragePermissions, getStoryTextUrl, getStoryAudioUrl, getStoryTextContent, getStoryImageUrl, fetchStoryMetadata, addProtagonistaToStory } from '../services/storyExamplesService';
import { getStoriesWithCache } from '../services/cacheService';
import { getStoryById } from '../services/storyService';
import StoryCard from './StoryCard';
import StoryModal from './StoryModal';
import './StoryExamplesSection.css';

// AudioPlayer component for the modal
const AudioPlayer = ({ audioUrl, title }) => {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const setAudioData = () => {
        setDuration(audio.duration);
      };

      const setAudioTime = () => {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      };

      // Event listeners
      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(e.target.value);
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const getDownloadUrl = () => {
    if (typeof audioUrl === 'object' && audioUrl.url) {
      return audioUrl.url;
    }
    return audioUrl;
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={getDownloadUrl()} />

      <div className="player-controls">
        <button
          onClick={togglePlay}
          className="play-pause-btn"
          aria-label={isPlaying ? t('audioPlayer.pause') : t('audioPlayer.play')}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <div className="time-display">
          {formatTime(currentTime)}
        </div>

        <input
          type="range"
          className="progress-bar"
          value={progress}
          onChange={handleProgressChange}
          min="0"
          max="100"
          step="0.1"
          aria-label={t('audioPlayer.progress')}
        />

        <div className="time-display">
          {formatTime(duration)}
        </div>

        <a 
          href={getDownloadUrl()} 
          download={`${title || 'audio'}.mp3`}
          className="download-audio-btn"
          aria-label={t('audioPlayer.download')}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('audioPlayer.download')}
        </a>
      </div>
    </div>
  );
};

const StoryExamplesSection = ({ autoOpenStoryId }) => {
  const { t } = useTranslation();
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    age: 'all',
    language: 'all',
    level: 'all',
    sortBy: 'newest'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    content: '',
    audioUrl: null,
    showAudio: false,
    usingMockContent: false,
    imageUrl: null,
    storyId: null
  });

  // Cargar solo los metadatos inicialmente
  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        console.log("Cargando metadatos de historias...");
        
        const storyData = await fetchStoryMetadata();
        
        if (storyData && storyData.length > 0) {
          console.log(`✓ Éxito! Cargados ${storyData.length} metadatos de historias`);
          console.log("Ejemplo de historia con campos:", storyData[0]);
          // Mostrar solo un subconjunto de historias en la página principal (máximo 6)
          const limitedStories = storyData.slice(0, 6);
          setStories(limitedStories);
          setFilteredStories(limitedStories);
          setHasMore(storyData.length > 6);
        } else {
          console.warn("⚠ No se encontraron historias");
          setError(new Error("No se encontraron historias"));
        }
      } catch (error) {
        console.error("✗ Error al cargar metadatos de historias:", error);
        setError(error);
      } finally {
        setLoading(false);
        console.log("=== CARGA DE METADATOS COMPLETADA ===");
      }
    };
    
    loadStories();
  }, []);

  // Aplicar filtros localmente
  useEffect(() => {
    if (stories.length > 0) {
      let filtered = stories.filter(story => {
        return (filters.language === 'all' || story.language === filters.language) &&
               (filters.level === 'all' || story.level === filters.level);
      });
      
      // Apply sorting
      switch (filters.sortBy) {
        case 'rating':
          filtered = filtered.sort((a, b) => {
            if (b.averageRating !== a.averageRating) {
              return (b.averageRating || 0) - (a.averageRating || 0);
            }
            return (b.totalRatings || 0) - (a.totalRatings || 0);
          });
          break;
        case 'popular':
          filtered = filtered.sort((a, b) => (b.totalRatings || 0) - (a.totalRatings || 0));
          break;
        case 'newest':
        default:
          filtered = filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          break;
      }
      
      setFilteredStories(filtered);
    }
  }, [filters, stories]);

  // Auto-load story from URL parameter
  useEffect(() => {
    if (autoOpenStoryId && !modalState.isOpen) {
      loadStoryFromId(autoOpenStoryId);
    }
  }, [autoOpenStoryId, modalState.isOpen]);

  const loadStoryFromId = async (storyId) => {
    try {
      console.log("[AUTO-LOAD] Loading story with ID:", storyId);
      
      // Fetch the story data from backend
      const response = await getStoryById(storyId);
      const story = response.story;
      
      if (!story) {
        throw new Error('Story not found');
      }

      console.log("[AUTO-LOAD] Story loaded:", story.title);

      // Load story content if available
      let content = story.content || '';
      
      // Load audio URL if available
      let audioUrl = null;
      if (story.audioPath) {
        try {
          // For user stories, the audioPath might be a full URL or a path
          if (story.audioPath.startsWith('http')) {
            audioUrl = story.audioPath;
          } else {
            audioUrl = await getStoryAudioUrl(story.audioPath);
          }
          console.log("[AUTO-LOAD] Audio URL loaded");
        } catch (error) {
          console.warn("[AUTO-LOAD] Could not load audio:", error);
        }
      }

      // Load image URL if available
      let imageUrl = null;
      if (story.imagePath) {
        try {
          imageUrl = await getStoryImageUrl(story.imagePath);
          console.log("[AUTO-LOAD] Image URL loaded");
        } catch (error) {
          console.warn("[AUTO-LOAD] Could not load image:", error);
        }
      }

      // Open modal with the loaded story
      setModalState({
        isOpen: true,
        title: story.title,
        content: content,
        audioUrl: audioUrl,
        showAudio: !!audioUrl,
        usingMockContent: false,
        imageUrl: imageUrl,
        storyId: storyId
      });

    } catch (error) {
      console.error("[AUTO-LOAD] Error loading story:", error);
      
      // Show a user-friendly error message
      setModalState({
        isOpen: true,
        title: t('common.error'),
        content: error.message === 'Story not found' 
          ? t('storyExamples.storyNotFound', 'Story not found. It may have been removed or you may not have permission to view it.')
          : t('storyExamples.loadingError', 'There was an error loading the story. Please try again later.'),
        audioUrl: null,
        showAudio: false,
        usingMockContent: false,
        imageUrl: null,
        storyId: null
      });
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  const handleStoryClick = async (story, actionType = 'text') => {
    console.log("[SECTION] Story clicked:", story.title, "Action:", actionType);

    try {
      let content = null;
      let audioUrl = null;

      // Load content based on action type
      if (actionType === 'text' || actionType === 'both') {
        // Load text content
        if (story.textPath) {
          try {
            content = await getStoryTextContent(story.textPath);
            console.log("[SECTION] Text content loaded:", !!content);
          } catch (error) {
            console.error("[SECTION] Error loading text content:", error);
            content = `Error al cargar el contenido del texto: ${error.message}`;
          }
        } else {
          content = "El contenido de texto no está disponible para esta historia.";
        }
      }

      if (actionType === 'audio' || actionType === 'both') {
        // Load audio content
        if (story.audioPath) {
          try {
            audioUrl = await getStoryAudioUrl(story.audioPath);
            console.log("[SECTION] Audio URL loaded:", !!audioUrl);
          } catch (error) {
            console.error("[SECTION] Error loading audio:", error);
            // Don't set audioUrl if there's an error
          }
        }
      }

      // Get image URL
      let imageUrl = null;
      if (story.imagePath) {
        try {
          imageUrl = await getStoryImageUrl(story.imagePath);
          console.log("[SECTION] Image URL loaded:", imageUrl);
        } catch (error) {
          console.error("[SECTION] Error loading image:", error);
        }
      }

      // Open modal with content
      setModalState({
        isOpen: true,
        title: story.title,
        content: content,
        audioUrl: audioUrl,
        showAudio: !!audioUrl,
        usingMockContent: false,
        imageUrl: imageUrl,
        storyId: story.id
      });
    } catch (error) {
      console.error("[SECTION] Error handling story click:", error);
      setError(error);
    }
  };

  const handleCloseModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      console.log("Cargando más historias...");
      
      const storyData = await fetchStoryMetadata();
      const nextPage = page + 1;
      const startIndex = 0;
      const endIndex = nextPage * 6;
      const newStories = storyData.slice(startIndex, endIndex);
      
      if (newStories.length > stories.length) {
        setStories(newStories);
        setPage(nextPage);
        setHasMore(storyData.length > newStories.length);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error al cargar más historias:", error);
      setError(error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="story-examples-section loading">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="story-examples-section error">
        <p>{t('common.error')}</p>
        <button onClick={() => window.location.reload()}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <section className="story-examples-section">
      <div className="section-header">
        <h2>{t('storyExamples.title')}</h2>
        <p>{t('storyExamples.subtitle')}</p>
      </div>

      <div className="filters-container">
        <h3>{t('storyExamples.filters.title')}</h3>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="home-language-filter">{t('storyExamples.filters.language')}</label>
            <div className="select-wrapper">
              <select 
                id="home-language-filter" 
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
              >
                <option value="all">{t('storyExamples.languages.all')}</option>
                <option value="spanish">{t('storyExamples.languages.spanish')}</option>
                <option value="english">{t('storyExamples.languages.english')}</option>
                <option value="catalan">{t('storyExamples.languages.catalan')}</option>
                <option value="german">{t('storyExamples.languages.german')}</option>
                <option value="italian">{t('storyExamples.languages.italian')}</option>
                <option value="french">{t('storyExamples.languages.french')}</option>
                <option value="galician">{t('storyExamples.languages.galician')}</option>
                <option value="basque">{t('storyExamples.languages.basque')}</option>
                <option value="portuguese">{t('storyExamples.languages.portuguese')}</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="home-level-filter">{t('storyExamples.filters.level')}</label>
            <div className="select-wrapper">
              <select 
                id="home-level-filter" 
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

          <div className="filter-group">
            <label htmlFor="home-sort-filter">Ordenar por</label>
            <div className="select-wrapper">
              <select 
                id="home-sort-filter" 
                value={filters.sortBy || 'newest'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="newest">Más recientes</option>
                <option value="rating">Mejor puntuadas</option>
                <option value="popular">Más populares</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="stories-grid">
        {(() => {
          console.log('🔍 [StoryExamplesSection] About to render stories:', filteredStories.length);
          if (filteredStories.length > 0) {
            console.log('🔍 [StoryExamplesSection] First story data:', filteredStories[0]);
            console.log('🔍 [StoryExamplesSection] First story keys:', Object.keys(filteredStories[0]));
            console.log('🔍 [StoryExamplesSection] First story id:', filteredStories[0].id);
          }
          return filteredStories.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              onStoryClick={handleStoryClick}
            />
          ));
        })()}
      </div>
      
      <div className="view-all-container">
        {hasMore && (
          <button 
            onClick={handleLoadMore} 
            className="btn btn-primary view-all-btn"
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <span className="loading-spinner"></span>
                {t('common.loading')}
              </>
            ) : (
              t('common.seeAllStories')
            )}
          </button>
        )}
      </div>

      <StoryModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        title={modalState.title}
        content={modalState.content}
        audioUrl={modalState.audioUrl}
        showAudio={modalState.showAudio}
        usingMockContent={modalState.usingMockContent}
        imageUrl={modalState.imageUrl}
      />
    </section>
  );
};

export default StoryExamplesSection; 